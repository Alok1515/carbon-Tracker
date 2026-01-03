import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserDailyQuest, DailyQuest } from '@/db/models';

// GET - Fetch user's daily quests for today
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get all active quests
    const activeQuests = await DailyQuest.find({ isActive: true }).lean();

    // Get user's progress for today
    const userQuests = await UserDailyQuest.find({
      userId,
      date: today
    }).lean();

    // Create a map for quick lookup
    const userQuestMap = new Map(
      userQuests.map(uq => [uq.questId, uq])
    );

      // Combine quest data with user progress
      const questsWithProgress = activeQuests.map(quest => {
        const userQuest = userQuestMap.get(quest.questId);
        
        return {
          questId: quest.questId,
          title: quest.title,
          description: quest.description,
          category: quest.category,
          pointsReward: quest.points,
          icon: quest.icon,
          requirement: quest.requirement,
          action: quest.action,
            userProgress: {
              id: userQuest?._id?.toString() || '',
              progress: userQuest?.progress || 0,
              completed: !!userQuest?.completed,
              claimed: !!userQuest?.claimed || (userQuest?.pointsEarned ? userQuest.pointsEarned > 0 : false),
              completedAt: userQuest?.completedAt,
              questDate: userQuest?.date || today
            }
        };
      });


    return NextResponse.json(questsWithProgress, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST - Update quest progress
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, questId, progressIncrement = 1 } = body;

    if (!userId || !questId) {
      return NextResponse.json(
        { error: 'userId and questId are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Get the quest details
    const quest = await DailyQuest.findOne({ questId, isActive: true });
    
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found or inactive', code: 'QUEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Find or create user quest record
    let userQuest = await UserDailyQuest.findOne({
      userId,
      questId,
      date: today
    });

    if (!userQuest) {
      // Create new record
      userQuest = await UserDailyQuest.create({
          userId,
          questId,
          progress: progressIncrement,
          completed: progressIncrement >= quest.requirement,
          claimed: false,
          date: today,
          pointsEarned: 0,
          completedAt: progressIncrement >= quest.requirement ? now : undefined,
          createdAt: now,
          updatedAt: now
        });
      } else if (!userQuest.completed) {
        // Update existing record
        const newProgress = userQuest.progress + progressIncrement;
        const isCompleted = newProgress >= quest.requirement;

        userQuest.progress = newProgress;
        userQuest.completed = isCompleted;
        userQuest.updatedAt = now;

        if (isCompleted && !userQuest.completedAt) {
          userQuest.completedAt = now;
        }

        await userQuest.save();
      }


    return NextResponse.json(
      {
        questId: userQuest.questId,
        progress: userQuest.progress,
        completed: userQuest.completed,
        claimed: userQuest.claimed,
        pointsEarned: userQuest.pointsEarned,
        requirement: quest.requirement
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
