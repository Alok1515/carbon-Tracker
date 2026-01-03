import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import { UserStats, Emissions } from "@/db/models";

export async function GET() {
  try {
    await connectDB();

    // Get all user-stats records
    const allStats = await UserStats.find({}).lean();
    
    // Get emissions count for each user
    const results = [];
    for (const stat of allStats) {
      const emissionsCount = await Emissions.countDocuments({ userId: stat.userId });
      results.push({
        userId: stat.userId,
        hasLoggedEmissions: stat.hasLoggedEmissions,
        emissionsCount,
        totalEmissions: stat.totalEmissions,
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    console.error("Error verifying flag:", error);
    return NextResponse.json(
      { error: "Failed to verify flag", details: error.message },
      { status: 500 }
    );
  }
}
