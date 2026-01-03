import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserStats, Emissions } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all user stats with hasLoggedEmissions field
    const allUserStats = await UserStats.find({}).lean();
    
    const results = [];
    
    for (const userStat of allUserStats) {
      const emissionsCount = await Emissions.countDocuments({ userId: userStat.userId });
      
      results.push({
        userId: userStat.userId,
        hasLoggedEmissions: userStat.hasLoggedEmissions,
        actualEmissionsCount: emissionsCount,
        mismatch: (userStat.hasLoggedEmissions && emissionsCount === 0) || (!userStat.hasLoggedEmissions && emissionsCount > 0)
      });
    }
    
    return NextResponse.json({
      totalUsers: allUserStats.length,
      usersWithFlag: allUserStats.filter(u => u.hasLoggedEmissions).length,
      usersWithoutFlag: allUserStats.filter(u => !u.hasLoggedEmissions).length,
      usersWithMissingField: allUserStats.filter(u => u.hasLoggedEmissions === undefined).length,
      details: results
    }, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
