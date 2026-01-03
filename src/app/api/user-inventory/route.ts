import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserInventory, ShopItem } from '@/db/models';

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

    const inventory = await UserInventory.find({ userId });
    const itemIds = inventory.map(item => item.itemId);
    
    const items = await ShopItem.find({ itemId: { $in: itemIds } });

    const inventoryWithDetails = inventory.map(inv => {
      const item = items.find(i => i.itemId === inv.itemId);
      return {
        ...inv.toObject(),
        item
      };
    });

    return NextResponse.json(inventoryWithDetails);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
