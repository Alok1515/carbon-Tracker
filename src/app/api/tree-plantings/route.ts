import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { TreePlantings } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const aggregate = searchParams.get('aggregate');

    // Validate userId is provided
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Handle aggregate request FIRST - must check before other operations
    if (aggregate === 'true') {
      const allPlantings = await TreePlantings.find({ userId }).lean();
      
      const totalTreesPlanted = allPlantings.reduce((sum, planting) => sum + planting.treesPlanted, 0);

      // Return early with aggregate result
      return NextResponse.json({
        userId,
        totalTreesPlanted
      }, { status: 200 });
    }

    // Handle regular list request (only reaches here if aggregate is not true)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const plantings = await TreePlantings.find({ userId })
      .sort({ plantingDate: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return NextResponse.json(plantings, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { userId, treesPlanted, plantingDate, notes } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'userId is required and must be a non-empty string',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Validate treesPlanted
    if (treesPlanted === undefined || treesPlanted === null) {
      return NextResponse.json(
        { 
          error: 'treesPlanted is required',
          code: 'MISSING_TREES_PLANTED'
        },
        { status: 400 }
      );
    }

    const treesPlantedNum = parseInt(treesPlanted);
    if (isNaN(treesPlantedNum) || treesPlantedNum <= 0) {
      return NextResponse.json(
        { 
          error: 'treesPlanted must be a positive integer',
          code: 'INVALID_TREES_PLANTED'
        },
        { status: 400 }
      );
    }

    // Validate plantingDate
    if (!plantingDate || typeof plantingDate !== 'string' || plantingDate.trim() === '') {
      return NextResponse.json(
        { 
          error: 'plantingDate is required and must be a non-empty string',
          code: 'INVALID_PLANTING_DATE'
        },
        { status: 400 }
      );
    }

    // Create new tree planting entry
    const newPlanting = await TreePlantings.create({
      userId: userId.trim(),
      treesPlanted: treesPlantedNum,
      plantingDate: plantingDate.trim(),
      notes: notes ? notes.trim() : null,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json(newPlanting, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}