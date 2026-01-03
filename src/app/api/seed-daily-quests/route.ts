import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { DailyQuest } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const now = new Date().toISOString();

    const defaultQuests = [
      {
        questId: 'log_emissions_1',
        title: 'Log Your First Emission',
        description: 'Track any emission activity today',
        category: 'tracking',
        points: 10,
        icon: '📝',
        requirement: 1,
        action: 'log_emissions',
        isActive: true,
        createdAt: now
      },
      {
        questId: 'log_emissions_3',
        title: 'Track 3 Activities',
        description: 'Log 3 different emission activities',
        category: 'tracking',
        points: 25,
        icon: '📊',
        requirement: 3,
        action: 'log_emissions',
        isActive: true,
        createdAt: now
      },
      {
        questId: 'visit_dashboard',
        title: 'Check Your Dashboard',
        description: 'Visit your dashboard today',
        category: 'engagement',
        points: 5,
        icon: '👀',
        requirement: 1,
        action: 'visit_dashboard',
        isActive: true,
        createdAt: now
      },
      {
        questId: 'chat_with_assistant',
        title: 'Ask the AI Assistant',
        description: 'Get carbon reduction tips from our AI',
        category: 'engagement',
        points: 15,
        icon: '🤖',
        requirement: 1,
        action: 'chat_with_assistant',
        isActive: true,
        createdAt: now
      },
      {
        questId: 'plant_trees',
        title: 'Plant a Tree',
        description: 'Contribute to carbon offsetting',
        category: 'action',
        points: 30,
        icon: '🌳',
        requirement: 1,
        action: 'plant_trees',
        isActive: true,
        createdAt: now
      },
      {
        questId: 'check_leaderboard',
        title: 'View Leaderboard',
        description: 'Check your ranking today',
        category: 'engagement',
        points: 5,
        icon: '🏆',
        requirement: 1,
        action: 'check_leaderboard',
        isActive: true,
        createdAt: now
      },
      {
        questId: 'low_emissions_day',
        title: 'Low Emission Day',
        description: 'Keep daily emissions under 5kg CO2',
        category: 'achievement',
        points: 50,
        icon: '🌟',
        requirement: 1,
        action: 'low_emissions_day',
        isActive: true,
        createdAt: now
      }
    ];

    // Delete existing quests and insert new ones
    await DailyQuest.deleteMany({});
    const result = await DailyQuest.insertMany(defaultQuests);

    return NextResponse.json(
      {
        message: 'Daily quests seeded successfully',
        count: result.length,
        quests: result
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
