import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserDailyQuest } from '@/db/models';

// GET - Get total points earned by user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'all'; // 'today', 'week', 'month', 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    let dateFilter: any = {};

    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dateFilter = { date: today };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { date: { $gte: weekAgo.toISOString().split('T')[0] } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      dateFilter = { date: { $gte: monthAgo.toISOString().split('T')[0] } };
    }

    // Get all completed quests for the user in the period
    const completedQuests = await UserDailyQuest.find({
      userId,
      completed: true,
      ...dateFilter
    }).lean();

    const totalPoints = completedQuests.reduce((sum, quest) => sum + quest.pointsEarned, 0);
    const totalQuestsCompleted = completedQuests.length;

    return NextResponse.json(
      {
        userId,
        period,
        totalPoints,
        totalQuestsCompleted,
        completedQuests: completedQuests.map(q => ({
          questId: q.questId,
          pointsEarned: q.pointsEarned,
          completedAt: q.completedAt,
          date: q.date
        }))
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
