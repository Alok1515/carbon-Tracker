import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserStats } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
      // Query all user_stats records ordered by totalEmissions ascending (lowest emissions = best rank)
      // TEMPORARILY show all users (commented out hasLoggedEmissions filter while we debug)
      const allUserStats = await UserStats.find({})
        .sort({ totalEmissions: 1 })
        .lean();

    if (allUserStats.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users to rank",
        usersRanked: 0
      }, { status: 200 });
    }

    // Loop through results and assign rank starting from 1
    let currentRank = 1;
    const updatePromises = [];

    for (const userStat of allUserStats) {
      const updatePromise = UserStats.findByIdAndUpdate(
        userStat._id,
        {
          rank: currentRank,
          lastCalculated: new Date().toISOString()
        }
      );
      
      updatePromises.push(updatePromise);
      currentRank++;
    }

    // Execute all updates
    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Leaderboard recalculated",
      usersRanked: allUserStats.length
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}