import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import User from '@/db/models/User';
import UserStats from '@/db/models/UserStats';
import Emissions from '@/db/models/Emissions';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const usersAnalyzed: number[] = [];
    const details: Array<{ userId: string; action: string; recordsAffected: number }> = [];
    let totalUserStatsUpdated = 0;
    let totalEmissionsUpdated = 0;

    // Get all users from the User collection
    const users = await User.find({}).lean();

    if (!users || users.length === 0) {
      return NextResponse.json({
        usersAnalyzed: 0,
        userStatsUpdated: 0,
        emissionsUpdated: 0,
        details: [],
        message: 'No users found in database'
      }, { status: 200 });
    }

    // Process each user
    for (const user of users) {
      const userId = user._id.toString();
      const betterAuthId = user.id; // Better Auth format ID

      usersAnalyzed.push(1);

      // Check if user has both _id and id fields and they differ
      if (betterAuthId && betterAuthId !== userId) {
        // Find UserStats records with Better Auth ID format
        const userStatsCount = await UserStats.countDocuments({ 
          userId: betterAuthId 
        });

        // Find Emissions records with Better Auth ID format
        const emissionsCount = await Emissions.countDocuments({ 
          userId: betterAuthId 
        });

        if (userStatsCount > 0 || emissionsCount > 0) {
          if (dryRun) {
            // Preview mode - don't make changes
            details.push({
              userId: betterAuthId,
              action: `PREVIEW: Would update ${userStatsCount} UserStats and ${emissionsCount} Emissions records to use MongoDB ObjectId`,
              recordsAffected: userStatsCount + emissionsCount
            });

            totalUserStatsUpdated += userStatsCount;
            totalEmissionsUpdated += emissionsCount;
          } else {
            // Actual update mode
            let userStatsUpdated = 0;
            let emissionsUpdated = 0;

            // Update UserStats records
            if (userStatsCount > 0) {
              const userStatsResult = await UserStats.updateMany(
                { userId: betterAuthId },
                { $set: { userId: userId } }
              );
              userStatsUpdated = userStatsResult.modifiedCount || 0;
              totalUserStatsUpdated += userStatsUpdated;
            }

            // Update Emissions records
            if (emissionsCount > 0) {
              const emissionsResult = await Emissions.updateMany(
                { userId: betterAuthId },
                { $set: { userId: userId } }
              );
              emissionsUpdated = emissionsResult.modifiedCount || 0;
              totalEmissionsUpdated += emissionsUpdated;
            }

            details.push({
              userId: betterAuthId,
              action: `Updated to use MongoDB ObjectId (${userId})`,
              recordsAffected: userStatsUpdated + emissionsUpdated
            });
          }
        } else {
          // No mismatched records found for this user
          details.push({
            userId: betterAuthId,
            action: 'No mismatched records found',
            recordsAffected: 0
          });
        }
      } else {
        // User IDs match or no Better Auth ID present
        details.push({
          userId: userId,
          action: 'User IDs already consistent',
          recordsAffected: 0
        });
      }
    }

    const response = {
      usersAnalyzed: usersAnalyzed.length,
      userStatsUpdated: totalUserStatsUpdated,
      emissionsUpdated: totalEmissionsUpdated,
      details: details,
      ...(dryRun && { 
        note: 'Dry run mode - no changes were made. Set dryRun=false to apply changes.' 
      })
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}