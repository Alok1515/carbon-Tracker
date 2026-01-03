import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserStats, UserProfile } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
      // Get all user stats sorted by emissions
      // TEMPORARILY show all users (commented out hasLoggedEmissions filter while we debug)
      const leaderboard = await UserStats.find({})
        .sort({ totalEmissions: 1 })
        .limit(50)
        .lean();

    // Get database connection to query the better-auth 'user' collection directly
    const connection = await connectToDatabase();
    const db = connection.connection.db;
    const userCollection = db.collection('user'); // Better-auth uses 'user' (singular)
    
    // Get all user IDs from leaderboard
    const userIds = leaderboard.map(stat => stat.userId);
    
    // Query the better-auth 'user' collection for all users
    const users = await userCollection.find({}).toArray();
    
    // Fetch all user profiles to get custom display names AND account types
    const profiles = await UserProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map(p => [String(p.userId), p]));
    
    // Create a comprehensive user lookup map using both _id and id fields
    const userByObjectId = new Map(users.map(user => [String(user._id), user]));
    
    // Also map by the 'id' field (Better Auth compatibility)
    users.forEach(user => {
      if (user.id) {
        userByObjectId.set(user.id, user);
      }
    });

    // Combine the data with account type
    const leaderboardWithUsers = leaderboard.map(stats => {
      // Try matching with userId from stats
      let user = userByObjectId.get(String(stats.userId));
      
      // Get user profile for custom display name and account type
      const profile = profileMap.get(String(stats.userId));
      
      // Fallback: Search by email or name if direct match fails
      if (!user) {
        console.warn(`⚠️ User not found for userId: ${stats.userId}`);
      }
      
        // Use auth name if available (for real-time updates), fallback to displayName from profile
        const displayName = user?.name || profile?.displayName || 'Anonymous User';
        const accountType = profile?.accountType || 'individual'; // Default to 'individual'
      
      return {
        userId: stats.userId,
        userName: displayName,
        userEmail: user?.email || '',
        userImage: user?.image || null,
        totalEmissions: stats.totalEmissions,
        monthlyEmissions: stats.monthlyEmissions,
        rank: stats.rank,
        treesEquivalent: stats.treesEquivalent,
        accountType: accountType, // Add account type to response
      };
    });

    return NextResponse.json(leaderboardWithUsers, { status: 200 });
  } catch (error) {
    console.error('GET leaderboard error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}