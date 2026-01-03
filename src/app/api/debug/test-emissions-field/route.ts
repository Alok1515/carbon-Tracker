import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Query directly using MongoDB native driver
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    
    const userStatsCollection = db.collection('user_stats');
    
    // Get all documents
    const allDocs = await userStatsCollection.find({}).limit(5).toArray();
    
    // Count with hasLoggedEmissions: true
    const countWithFlag = await userStatsCollection.countDocuments({ hasLoggedEmissions: true });
    const countWithoutFlag = await userStatsCollection.countDocuments({ hasLoggedEmissions: false });
    const countUndefined = await userStatsCollection.countDocuments({ hasLoggedEmissions: { $exists: false } });
    
    return NextResponse.json({
      totalDocs: allDocs.length,
      countWithFlag,
      countWithoutFlag,
      countUndefined,
      sampleDocs: allDocs.map(doc => ({
        userId: doc.userId,
        hasLoggedEmissions: doc.hasLoggedEmissions,
        hasLoggedEmissionsType: typeof doc.hasLoggedEmissions
      }))
    }, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
