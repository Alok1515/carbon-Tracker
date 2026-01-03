import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { UserBadge, Badge } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Get user badges with badge details populated
    const userBadges = await UserBadge.find({ userId }).lean();
    
    // Get all badge details
    const badgeIds = userBadges.map(ub => ub.badgeId);
    const badges = await Badge.find({ badgeId: { $in: badgeIds } }).lean();
    
    // Create a map of badges by badgeId
    const badgeMap = new Map(badges.map(b => [b.badgeId, b]));
    
    // Combine user badges with badge details
    const results = userBadges.map(userBadge => {
      const badge = badgeMap.get(userBadge.badgeId);
      return {
        id: userBadge._id,
        userId: userBadge.userId,
        badgeId: userBadge.badgeId,
        progress: userBadge.progress,
        earned: userBadge.earned,
        earnedAt: userBadge.earnedAt,
        createdAt: userBadge.createdAt,
        updatedAt: userBadge.updatedAt,
        badge: badge ? {
          id: badge._id,
          badgeId: badge.badgeId,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          requirement: badge.requirement,
          category: badge.category,
          createdAt: badge.createdAt,
        } : null
      };
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { userId, badgeId, progress, earned } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!badgeId) {
      return NextResponse.json({ 
        error: 'badgeId is required',
        code: 'MISSING_BADGE_ID' 
      }, { status: 400 });
    }

    // Validate progress if provided
    if (progress !== undefined && progress !== null) {
      const progressNum = parseInt(progress);
      if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        return NextResponse.json({ 
          error: 'progress must be between 0 and 100',
          code: 'INVALID_PROGRESS' 
        }, { status: 400 });
      }
    }

    // Verify badge exists
    const badgeExists = await Badge.findOne({ badgeId }).lean();

    if (!badgeExists) {
      return NextResponse.json({ 
        error: 'Badge not found',
        code: 'BADGE_NOT_FOUND' 
      }, { status: 404 });
    }

    const now = new Date().toISOString();
    const progressValue = progress !== undefined ? parseInt(progress) : 0;
    const earnedValue = earned !== undefined ? earned : false;

    // Check if user badge record exists
    const existingRecord = await UserBadge.findOne({ userId, badgeId }).lean();

    let result;
    let statusCode;

    if (existingRecord) {
      // Update existing record
      const updateData: any = {
        progress: progressValue,
        earned: earnedValue,
        updatedAt: now,
      };

      // Set earnedAt if earned is true and it wasn't earned before
      if (earnedValue && !existingRecord.earned) {
        updateData.earnedAt = now;
      }

      result = await UserBadge.findOneAndUpdate(
        { userId, badgeId },
        updateData,
        { new: true }
      ).lean();

      statusCode = 200;
    } else {
      // Create new record
      const insertData: any = {
        userId,
        badgeId,
        progress: progressValue,
        earned: earnedValue,
        createdAt: now,
        updatedAt: now,
      };

      // Set earnedAt if earned is true
      if (earnedValue) {
        insertData.earnedAt = now;
      }

      result = await UserBadge.create(insertData);

      statusCode = 201;
    }

    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to create/update user badge',
        code: 'OPERATION_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}