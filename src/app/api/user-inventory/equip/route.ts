import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserInventory, UserProfile, ShopItem } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, itemId, equip } = body;

    if (!userId || !itemId || typeof equip !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user owns the item
    const inventoryItem = await UserInventory.findOne({ userId, itemId });
    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Get item details to check type
    const item = await ShopItem.findOne({ itemId });
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // If equipping, unequip all other items of the same type
    if (equip) {
      const allUserItems = await UserInventory.find({ userId });
      const sameTypeItemIds = [];
      
      for (const userItem of allUserItems) {
        const shopItem = await ShopItem.findOne({ itemId: userItem.itemId });
        if (shopItem && shopItem.type === item.type && shopItem.itemId !== itemId) {
          sameTypeItemIds.push(userItem.itemId);
        }
      }

      await UserInventory.updateMany(
        { userId, itemId: { $in: sameTypeItemIds } },
        { equipped: false }
      );
    }

    // Update the item
    inventoryItem.equipped = equip;
    await inventoryItem.save();

    // Update user profile
    let userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      userProfile = await UserProfile.create({
        userId,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        updatedAt: new Date().toISOString()
      });
    }

    // Update equipped items in profile
    const fieldMap: Record<string, string> = {
      'avatar_frame': 'equippedFrame',
      'title': 'equippedTitle'
    };

    const field = fieldMap[item.type];
    if (field) {
      (userProfile as any)[field] = equip ? itemId : null;
      userProfile.updatedAt = new Date().toISOString();
      await userProfile.save();
    }

    return NextResponse.json({
      success: true,
      equipped: equip,
      profile: userProfile
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    );
  }
}
