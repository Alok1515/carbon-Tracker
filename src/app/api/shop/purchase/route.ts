import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { ShopItem, UserInventory, UserProfile, UserDailyQuest } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, itemId } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await ShopItem.findOne({ itemId, isActive: true });
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if user already owns the item
    const existingItem = await UserInventory.findOne({ userId, itemId });
    if (existingItem) {
      return NextResponse.json(
        { error: 'You already own this item' },
        { status: 400 }
      );
    }

    // Get user's total quest points
    const userQuests = await UserDailyQuest.find({ userId, completed: true });
    const totalPoints = userQuests.reduce((sum, quest) => sum + quest.pointsEarned, 0);

    // Get user profile to check points spent
    let userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      userProfile = await UserProfile.create({
        userId,
        totalPointsEarned: totalPoints,
        totalPointsSpent: 0,
        updatedAt: new Date().toISOString()
      });
    }

    const availablePoints = totalPoints - userProfile.totalPointsSpent;

    // Check if user has enough points
    if (availablePoints < item.price) {
      return NextResponse.json(
        { error: 'Insufficient quest points', available: availablePoints, required: item.price },
        { status: 400 }
      );
    }

    // Purchase the item
    const inventoryItem = await UserInventory.create({
      userId,
      itemId,
      purchasedAt: new Date().toISOString(),
      equipped: false
    });

    // Update user profile
    userProfile.totalPointsSpent += item.price;
    userProfile.totalPointsEarned = totalPoints;
    userProfile.updatedAt = new Date().toISOString();
    await userProfile.save();

    return NextResponse.json({
      success: true,
      item: inventoryItem,
      remainingPoints: availablePoints - item.price
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    return NextResponse.json(
      { error: 'Failed to purchase item' },
      { status: 500 }
    );
  }
}
