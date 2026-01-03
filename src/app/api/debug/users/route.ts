import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/mongodb';
import { User, UserStats, Emissions } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const limitParam = searchParams.get('limit');

    // Validate collection parameter
    if (!collection) {
      return NextResponse.json(
        {
          error: 'Collection parameter is required',
          code: 'MISSING_COLLECTION',
        },
        { status: 400 }
      );
    }

    const validCollections = ['users', 'userstats', 'emissions'];
    if (!validCollections.includes(collection)) {
      return NextResponse.json(
        {
          error: `Invalid collection. Must be one of: ${validCollections.join(', ')}`,
          code: 'INVALID_COLLECTION',
        },
        { status: 400 }
      );
    }

    // Validate and parse limit
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return NextResponse.json(
          {
            error: 'Limit must be a number between 1 and 100',
            code: 'INVALID_LIMIT',
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Connect to MongoDB
    await connectToDatabase();

    let results;

    // Query based on collection type
    switch (collection) {
      case 'users':
        results = await User.find().limit(limit).lean();
        break;

      case 'userstats':
        results = await UserStats.find().limit(limit).lean();
        break;

      case 'emissions':
        results = await Emissions.find().limit(limit).lean();
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid collection specified',
            code: 'INVALID_COLLECTION',
          },
          { status: 400 }
        );
    }

    // Return the raw documents with all fields
    return NextResponse.json({
      collection,
      count: results.length,
      limit,
      documents: results,
    });
  } catch (error) {
    console.error('GET /api/diagnostic error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }
}