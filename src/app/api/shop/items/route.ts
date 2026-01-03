import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { ShopItem } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const filter: any = { isActive: true };
    if (type) {
      filter.type = type;
    }

    const items = await ShopItem.find(filter).sort({ rarity: 1, price: 1 });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop items' },
      { status: 500 }
    );
  }
}
