import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserProfile, UserDailyQuest } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      // Create default profile with 'individual' as default account type
      const userQuests = await UserDailyQuest.find({ userId, completed: true });
      const totalPoints = userQuests.reduce((sum, quest) => sum + quest.pointsEarned, 0);
      
      profile = await UserProfile.create({
        userId,
        accountType: 'individual',
        totalPointsEarned: totalPoints,
        totalPointsSpent: 0,
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, accountType } = body;

    if (!userId || !accountType) {
      return NextResponse.json(
        { error: 'Missing userId or accountType' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    let profile = await UserProfile.findOne({ userId });
    
    if (profile) {
      return NextResponse.json(profile);
    }

    // Create new profile with account type
    const userQuests = await UserDailyQuest.find({ userId, completed: true });
    const totalPoints = userQuests.reduce((sum, quest) => sum + quest.pointsEarned, 0);
    
    profile = await UserProfile.create({
      userId,
      accountType,
      totalPointsEarned: totalPoints,
      totalPointsSpent: 0,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, displayName, bio } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Trim and validate displayName
    const trimmedDisplayName = displayName?.trim();

    // Get current user's profile first
    const currentProfile = await UserProfile.findOne({ userId });

    // Check if displayName is unique (case-insensitive) - only if a new name is provided
    if (trimmedDisplayName && trimmedDisplayName.length > 0) {
      const currentDisplayName = currentProfile?.displayName?.toLowerCase();
      const newDisplayName = trimmedDisplayName.toLowerCase();

      // Only check uniqueness if the name is actually changing
      if (currentDisplayName !== newDisplayName) {
        // Fetch all profiles except current user and check manually
        const allProfiles = await UserProfile.find({ userId: { $ne: userId } }, { displayName: 1 });
        
        const isDuplicate = allProfiles.some(profile => 
          profile.displayName && profile.displayName.toLowerCase() === newDisplayName
        );

        if (isDuplicate) {
          return NextResponse.json(
            { error: 'This display name is already taken. Please choose another one.' },
            { status: 409 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (trimmedDisplayName !== undefined && trimmedDisplayName.length > 0) {
      updateData.displayName = trimmedDisplayName;
    }
    if (bio !== undefined) {
      updateData.bio = bio.trim();
    }

    // If profile doesn't exist, add initial points and default account type
    if (!currentProfile) {
      const userQuests = await UserDailyQuest.find({ userId, completed: true });
      const totalPoints = userQuests.reduce((sum, quest) => sum + quest.pointsEarned, 0);
      updateData.totalPointsEarned = totalPoints;
      updateData.totalPointsSpent = 0;
      updateData.accountType = 'individual'; // Default if not set
    }

    // Use findOneAndUpdate with upsert to handle both create and update
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateData, $setOnInsert: { userId } },
      { new: true, upsert: true }
    );

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}