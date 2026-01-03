import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { Badge } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const allBadges = await Badge.find().lean();

    return NextResponse.json(allBadges, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}