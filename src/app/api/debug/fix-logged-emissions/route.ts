import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Use direct MongoDB collection access to bypass Mongoose schema caching
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    
    const userStatsCollection = db.collection('user_stats');
    const emissionsCollection = db.collection('emissions');
    
    // Get all user stats
    const allUserStats = await userStatsCollection.find({}).toArray();
    
    let updatedCount = 0;
    
    for (const userStat of allUserStats) {
      // Check if user has any emissions
      const emissionsCount = await emissionsCollection.countDocuments({ userId: userStat.userId });
      
      // Update hasLoggedEmissions using direct MongoDB operation
      const result = await userStatsCollection.updateOne(
        { _id: userStat._id },
        {
          $set: {
            hasLoggedEmissions: emissionsCount > 0
          }
        }
      );
      
      console.log(`Updated user ${userStat.userId}: hasLoggedEmissions=${emissionsCount > 0}, modified=${result.modifiedCount}`);
      updatedCount++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated hasLoggedEmissions for ${updatedCount} users`,
      updatedCount
    }, { status: 200 });
    
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
