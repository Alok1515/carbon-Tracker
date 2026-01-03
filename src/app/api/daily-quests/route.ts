import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { DailyQuest } from '@/db/models';

export async function GET() {
  try {
    await connectToDatabase();
    
    const quests = await DailyQuest.find({ isActive: true }).sort({ createdAt: 1 });
    
    return NextResponse.json(quests);
  } catch (error) {
    console.error('Error fetching daily quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily quests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { questId, title, description, category, points, icon, requirement, action, isActive = true } = body;
    
    if (!questId || !title || !description || !category || !points || !icon || !requirement || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const quest = await DailyQuest.create({
      questId,
      title,
      description,
      category,
      points,
      icon,
      requirement,
      action,
      isActive,
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json(quest);
  } catch (error) {
    console.error('Error creating daily quest:', error);
    return NextResponse.json(
      { error: 'Failed to create daily quest' },
      { status: 500 }
    );
  }
}