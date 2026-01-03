import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { User } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get ALL users without limit
    const allUsers = await User.find({}).lean();

    return NextResponse.json({
      totalCount: allUsers.length,
      users: allUsers
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}