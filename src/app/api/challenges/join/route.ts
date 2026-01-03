import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/db/connectDB"
import { Challenge, ChallengeProgress, UserStats } from "@/db/models"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    await connectDB()

    const session = await (await import("@/db/models")).Session.findOne({ token })
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const userId = session.userId
    const body = await request.json()
    const { challengeId } = body ?? {}

    if (!challengeId) {
      return NextResponse.json({ error: "challengeId is required" }, { status: 400 })
    }

    const challenge = await Challenge.findOne({ challengeId })
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    if (challenge.status !== "active") {
      return NextResponse.json({ error: "Challenge is not active" }, { status: 400 })
    }

    if (challenge.participants.some((p: any) => String(p) === String(userId))) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 })
    }

    challenge.participants.push(userId)
    await challenge.save()

    const userStats = await UserStats.findOne({ userId })
    const startEmissions = userStats?.monthlyEmissions || 0

    const progress = new ChallengeProgress({
      challengeId,
      userId,
      startEmissions,
      currentEmissions: startEmissions,
      reductionPercentage: 0,
      lastUpdated: new Date().toISOString(),
    })

    await progress.save()

    return NextResponse.json({
      message: "Joined challenge successfully",
      challenge: {
        id: challenge._id,
        challengeId: challenge.challengeId,
        name: challenge.name,
        description: challenge.description,
        status: challenge.status,
        participants: challenge.participants.length,
        isParticipant: true,
      },
    })
  } catch (error) {
    console.error("Error joining challenge:", error)
    return NextResponse.json({ error: "Failed to join challenge" }, { status: 500 })
  }
}
