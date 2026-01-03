import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserDailyQuest, DailyQuest, UserProfile } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, questId } = body;

    if (!userId || !questId) {
      return NextResponse.json(
        { error: 'userId and questId are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Find the user's quest for today
    const userQuest = await UserDailyQuest.findOne({
      userId,
      questId,
      date: today
    });

    if (!userQuest) {
      return NextResponse.json(
        { error: 'Quest progress not found for today', code: 'QUEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!userQuest.completed) {
      return NextResponse.json(
        { error: 'Quest is not yet completed', code: 'QUEST_NOT_COMPLETED' },
        { status: 400 }
      );
    }

    if (userQuest.claimed || (userQuest.pointsEarned && userQuest.pointsEarned > 0)) {
      return NextResponse.json(
        { error: 'Reward already claimed', code: 'ALREADY_CLAIMED' },
        { status: 400 }
      );
    }

    // Get quest details to find point value
    const quest = await DailyQuest.findOne({ questId });
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest definition not found', code: 'DEFINITION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update user quest status using findOneAndUpdate for atomicity
    const updatedUserQuest = await UserDailyQuest.findOneAndUpdate(
      {
        userId,
        questId,
        date: today,
        completed: true,
        $or: [
          { claimed: false },
          { claimed: { $exists: false } }
        ],
        $and: [
          { $or: [ { pointsEarned: 0 }, { pointsEarned: { $exists: false } } ] }
        ]
      },
      {
        $set: {
          claimed: true,
          pointsEarned: quest.points,
          updatedAt: new Date().toISOString()
        }
      },
      { new: true }
    );

    if (!updatedUserQuest) {
      return NextResponse.json(
        { error: 'Quest already claimed or not eligible', code: 'CLAIM_FAILED' },
        { status: 400 }
      );
    }

    // Add points to user profile using findOneAndUpdate
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $inc: { totalPointsEarned: quest.points },
        $set: { updatedAt: new Date().toISOString() }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      pointsAwarded: quest.points,
      newTotalPoints: updatedProfile.totalPointsEarned
    });

  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
