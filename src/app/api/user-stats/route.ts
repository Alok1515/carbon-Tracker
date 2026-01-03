import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserStats, Emissions, TreePlantings } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    let userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    userId = userId.trim();

      // Always recalculate stats from emissions table
      const userEmissions = await Emissions.find({ userId }).lean();

      // Check if user has logged emissions
      const hasLoggedEmissions = userEmissions.length > 0;

      // Calculate totalEmissions from emissions
      const totalEmissionsFromActivities = userEmissions.reduce((sum, emission) => sum + emission.co2, 0);

    // Calculate carbon offset from tree plantings
    // Each tree absorbs approximately 21 kg CO2 per year
    const treePlantings = await TreePlantings.find({ userId }).lean();
    const totalTreesPlanted = treePlantings.reduce((sum, planting) => sum + planting.treesPlanted, 0);
    const carbonOffsetGrams = totalTreesPlanted * 21 * 1000; // Convert kg to grams

    // Net emissions = Total emissions - Carbon offset from trees
    const totalEmissions = Math.max(0, totalEmissionsFromActivities - carbonOffsetGrams);

    // Calculate monthlyEmissions (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Start of current month
    const monthStart = new Date(currentYear, currentMonth, 1).toISOString();
    
    // Start of next month (end of current month)
    const monthEnd = new Date(currentYear, currentMonth + 1, 1).toISOString();

    const monthlyEmissionsData = await Emissions.find({
      userId,
      createdAt: { $gte: monthStart, $lte: monthEnd }
    }).lean();

    const monthlyEmissionsFromActivities = monthlyEmissionsData.reduce((sum, emission) => sum + emission.co2, 0);
    
    // Apply carbon offset proportionally to monthly emissions
    const offsetRatio = totalEmissionsFromActivities > 0 ? carbonOffsetGrams / totalEmissionsFromActivities : 0;
    const monthlyOffset = monthlyEmissionsFromActivities * offsetRatio;
    const monthlyEmissions = Math.max(0, monthlyEmissionsFromActivities - monthlyOffset);

    // Calculate trees equivalent needed to offset remaining emissions
    // totalEmissions is in grams, convert to kg then divide by 21 (kg CO2 per tree per year)
    const treesEquivalent = Math.ceil((totalEmissions / 1000) / 21);

    // Check if user_stats record exists
    const existingStats = await UserStats.findOne({ userId });

    let statsRecord;
    
        if (existingStats) {
          // Update existing record
          statsRecord = await UserStats.findOneAndUpdate(
            { userId },
            {
              $set: {
                totalEmissions,
                monthlyEmissions,
                treesEquivalent,
                hasLoggedEmissions,
                lastCalculated: new Date().toISOString()
              }
            },
            { new: true }
          );
        } else {
          // Create new stats record
          statsRecord = await UserStats.create({
            userId,
            totalEmissions,
            monthlyEmissions,
            rank: 0,
            treesEquivalent,
            hasLoggedEmissions,
            lastCalculated: new Date().toISOString()
          });
        }

    // Include gross emissions in the response for UI clarity
    const responseData = {
      ...statsRecord.toObject(),
      grossEmissions: totalEmissionsFromActivities,
      carbonOffset: carbonOffsetGrams,
      totalTreesPlanted
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}