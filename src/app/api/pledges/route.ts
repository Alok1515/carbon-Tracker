import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import { Emissions, Pledge, Session, User } from "@/db/models";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

async function findAuthUserByIdFlexible(userId: string) {
  if (!userId) return null;

  // Try to find the user in the 'user' collection first
  // We handle both string ID and ObjectId
  const orCondition: any[] = [{ _id: userId }];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    orCondition.push({ _id: new mongoose.Types.ObjectId(userId) });
  }

  try {
    // Try primary 'user' collection
    let user = await mongoose.connection.db?.collection('user').findOne({ $or: orCondition });
    if (user) return user;

    // Fallback to 'users' collection
    user = await mongoose.connection.db?.collection('users').findOne({ $or: orCondition });
    return user;
  } catch (error) {
    console.error("Error in findAuthUserByIdFlexible:", error);
    return null;
  }
}

async function getAuthedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  await connectDB();

  const session = await Session.findOne({ token });
  if (!session) return null;

  return session.userId;
}

async function sumEmissionsCo2(userId: string, fromISO: string, toISO: string) {
  const rows = await Emissions.find({
    userId,
    createdAt: { $gte: fromISO, $lte: toISO },
  }).lean();

  return rows.reduce((sum, row) => sum + (row.co2 || 0), 0);
}

/**
 * Calculates pledge progress based on real emissions reduction.
 *
 * Baseline window:
 * - the SAME duration immediately before the pledge started
 *   (start - elapsed .. start)
 *
 * Current window:
 * - emissions logged since pledge start
 *   (start .. now)
 */
async function calculatePledgeProgress(params: {
  userId: string;
  pledgeStartISO: string;
  targetReduction: number;
}) {
  const now = new Date();
  const start = new Date(params.pledgeStartISO);

  if (Number.isNaN(start.getTime())) {
    return {
      baselineEmissions: 0,
      currentEmissions: 0,
      actualReduction: 0,
      progress: 0,
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - start.getTime());
  const elapsedDays = Math.max(0.1, elapsedMs / (1000 * 60 * 60 * 24));
  const baselineStart = new Date(start.getTime() - elapsedMs);

  const [historicalBaseline, currentEmissions] = await Promise.all([
    sumEmissionsCo2(params.userId, baselineStart.toISOString(), start.toISOString()),
    sumEmissionsCo2(params.userId, start.toISOString(), now.toISOString()),
  ]);

  // Fallback to a default daily baseline (15kg CO2) if the user has no history.
  // This allows the progress bar to move based on "avoided" emissions even for new users.
  const DEFAULT_DAILY_BASELINE = 15; 
  const estimatedBaseline = DEFAULT_DAILY_BASELINE * elapsedDays;
  
  const baselineEmissions = Math.max(historicalBaseline, estimatedBaseline);

  const actualReduction = baselineEmissions - currentEmissions;
  const rawProgress =
    params.targetReduction > 0 && actualReduction > 0
      ? (actualReduction / params.targetReduction) * 100
      : 0;

  const progress = Math.max(0, Math.min(100, Math.round(rawProgress)));

  return { baselineEmissions, currentEmissions, actualReduction, progress };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: any = {};
    if (status) query.status = status;

    const { auth } = await import("@/lib/auth");
    const authSession = await auth.api.getSession({
      headers: request.headers as any,
    });

    const pledges = await Pledge.find(query).sort({ createdAt: -1 });

    const pledgesData = await Promise.all(
      pledges.map(async (pledge) => {
        let authorData;
        if (pledge.userId === userId && authSession?.user) {
          authorData = {
            id: userId,
            name: authSession.user.name,
            image: authSession.user.image,
          };
        } else {
          // Resolve other user names from DB
          const resolvedUser = await findAuthUserByIdFlexible(pledge.userId);
          authorData = {
            id: pledge.userId,
            name: resolvedUser?.name || "Unknown User",
            image: resolvedUser?.image,
          };
        }

        const pledgeStartISO = pledge.startDate || pledge.createdAt;
        const { progress } = await calculatePledgeProgress({
          userId: pledge.userId,
          pledgeStartISO,
          targetReduction: pledge.targetReduction,
        });

        return {
          id: pledge._id,
          pledgeId: pledge.pledgeId,
          author: authorData,
          title: pledge.title,
          description: pledge.description,
          targetReduction: pledge.targetReduction,
          deadline: pledge.deadline,
          status: pledge.status,
          supporters: pledge.supporters.length,
          isSupporting: pledge.supporters.includes(userId),
          progress,
          createdAt: pledge.createdAt,
          completedAt: pledge.completedAt,
        };
      })
    );

    return NextResponse.json(pledgesData);
  } catch (error) {
    console.error("Error fetching pledges:", error);
    return NextResponse.json({ error: "Failed to fetch pledges" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, targetReduction, deadline } = body;

    if (!title || !description || !targetReduction || !deadline) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const startDate = new Date().toISOString();

    // Capture a baseline snapshot at creation time.
    // We store the baseline for the FULL pledge duration (start..deadline),
    // from the same-length window immediately BEFORE start.
    // Live progress uses the elapsed window (see calculatePledgeProgress).
    const start = new Date(startDate);
    const deadlineDate = new Date(deadline);
    const fullDurationMs = deadlineDate.getTime() - start.getTime();

    // If deadline parsing fails, we still allow pledge creation, but baseline snapshot is 0.
    let baselineEmissions = 0;
    if (!Number.isNaN(deadlineDate.getTime()) && fullDurationMs > 0) {
      const baselineStart = new Date(start.getTime() - fullDurationMs);
      baselineEmissions = await sumEmissionsCo2(userId, baselineStart.toISOString(), startDate);
    }

    const pledgeId = randomUUID();

    const newPledge = new Pledge({
      pledgeId,
      userId,
      title,
      description,
      targetReduction,
      deadline,
      startDate,
      baselineEmissions,
      status: "active",
      supporters: [],
      progress: 0,
      createdAt: startDate,
    });

    await newPledge.save();

    const { auth } = await import("@/lib/auth");
    const authSession = await auth.api.getSession({
      headers: request.headers as any,
    });

    return NextResponse.json({
      message: "Pledge created successfully",
      pledge: {
        id: newPledge._id,
        pledgeId: newPledge.pledgeId,
        author: {
          id: userId,
          name: authSession?.user?.name || "Unknown",
          image: authSession?.user?.image,
        },
        title: newPledge.title,
        description: newPledge.description,
        targetReduction: newPledge.targetReduction,
        deadline: newPledge.deadline,
        startDate: newPledge.startDate,
        baselineEmissions: newPledge.baselineEmissions,
        status: newPledge.status,
        supporters: 0,
        isSupporting: false,
        progress: 0,
        createdAt: newPledge.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating pledge:", error);
    return NextResponse.json({ error: "Failed to create pledge" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pledgeId, action } = body;

    if (!pledgeId || !action) {
      return NextResponse.json({ error: "Pledge ID and action are required" }, { status: 400 });
    }

    const pledge = await Pledge.findOne({ pledgeId });
    if (!pledge) {
      return NextResponse.json({ error: "Pledge not found" }, { status: 404 });
    }

    if (action === "support") {
      if (pledge.supporters.includes(userId)) {
        pledge.supporters = pledge.supporters.filter((id: string) => id !== userId);
      } else {
        pledge.supporters.push(userId);
      }

      await pledge.save();

      return NextResponse.json({
        message: "Pledge support updated",
        supporters: pledge.supporters.length,
        isSupporting: pledge.supporters.includes(userId),
      });
    }

    if (action === "update_progress") {
      if (pledge.userId !== userId) {
        return NextResponse.json({ error: "Only pledge owner can update progress" }, { status: 403 });
      }

      const pledgeStartISO = pledge.startDate || pledge.createdAt;
      const { progress, actualReduction } = await calculatePledgeProgress({
        userId,
        pledgeStartISO,
        targetReduction: pledge.targetReduction,
      });

      pledge.progress = progress;

      if (pledge.progress >= 100) {
        pledge.status = "completed";
        pledge.completedAt = new Date().toISOString();
      }

      await pledge.save();

      return NextResponse.json({
        message: "Progress updated",
        progress: pledge.progress,
        status: pledge.status,
        actualReduction,
        targetReduction: pledge.targetReduction,
      });
    }

    if (action === "cancel") {
      if (pledge.userId !== userId) {
        return NextResponse.json({ error: "Only pledge owner can cancel" }, { status: 403 });
      }

      pledge.status = "failed";
      await pledge.save();

      return NextResponse.json({ message: "Pledge cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating pledge:", error);
    return NextResponse.json({ error: "Failed to update pledge" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pledgeId = searchParams.get("pledgeId");

    if (!pledgeId) {
      return NextResponse.json({ error: "Pledge ID is required" }, { status: 400 });
    }

    const pledge = await Pledge.findOne({ pledgeId });
    if (!pledge) {
      return NextResponse.json({ error: "Pledge not found" }, { status: 404 });
    }

    if (pledge.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await Pledge.deleteOne({ pledgeId });

    return NextResponse.json({ message: "Pledge deleted successfully" });
  } catch (error) {
    console.error("Error deleting pledge:", error);
    return NextResponse.json({ error: "Failed to delete pledge" }, { status: 500 });
  }
}
