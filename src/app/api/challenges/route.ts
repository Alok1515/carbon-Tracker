import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/connectDB';
import { Challenge, ChallengeProgress, User, UserStats } from '@/db/models';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

async function findAuthUserByIdFlexible(userId: string) {
  if (!userId) return null;

  // Try to find the user in the 'user' collection first
  // We handle both string ID and ObjectId
  const orCondition: any[] = [{ _id: userId }];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    orCondition.push({ _id: new mongoose.Types.ObjectId(userId) });
  }

  try {
    // Try primary 'user' collection
    let user = await mongoose.connection.db?.collection('user').findOne({ $or: orCondition });
    if (user) return user;

    // Fallback to 'users' collection
    user = await mongoose.connection.db?.collection('users').findOne({ $or: orCondition });
    return user;
  } catch (error) {
    console.error("Error in findAuthUserByIdFlexible:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    console.log('challenges GET: token received:', token.substring(0, 20) + '...');
    const session = await (await import('@/db/models')).Session.findOne({ token });
    console.log('challenges GET: session found:', !!session, session?.userId);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

      const userId = session.userId;
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const type = searchParams.get('type');

      const query: any = {};

      if (status) {
        query.status = status;
      }
      if (type) {
        query.type = type;
      }

      const { auth } = await import('@/lib/auth');
      const authSession = await auth.api.getSession({ 
        headers: request.headers as any
      });

      const challenges = await Challenge.find(query).sort({ createdAt: -1 });

        const challengesData = await Promise.all(
          challenges.map(async (challenge) => {
            let creatorData;
            if (challenge.createdBy === userId && authSession?.user) {
              creatorData = {
                id: userId,
                name: authSession.user.name,
                image: authSession.user.image
              };
            } else {
              const resolvedUser = await findAuthUserByIdFlexible(challenge.createdBy);
              creatorData = {
                id: challenge.createdBy,
                name: resolvedUser?.name || 'Unknown User',
                image: resolvedUser?.image
              };
            }

            const progress = await ChallengeProgress.find({ challengeId: challenge.challengeId });
          
          return {
            id: challenge._id,
            challengeId: challenge.challengeId,
            name: challenge.name,
            description: challenge.description,
            type: challenge.type,
            goal: challenge.goal,
            metric: challenge.metric,
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            status: challenge.status,
              createdBy: creatorData,
              participants: challenge.participants.length,
              isParticipant: challenge.participants.some((p: any) => String(p) === String(userId)),
              teams: challenge.teams,
            winner: challenge.winner,
            progress: progress.map(p => ({
              userId: p.userId,
              teamId: p.teamId,
              reductionPercentage: p.reductionPercentage
            })),
            createdAt: challenge.createdAt
          };
        })
      );

    return NextResponse.json(challengesData);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    console.log('challenges POST: token received:', token.substring(0, 20) + '...');
    const Session = (await import('@/db/models')).Session;
    const allSessions = await Session.find({}).limit(3);
    console.log('challenges POST: total sessions in DB:', await Session.countDocuments());
    console.log('challenges POST: sample tokens:', allSessions.map(s => s.token?.substring(0, 20) + '...'));
    
    const session = await Session.findOne({ token });
    console.log('challenges POST: session found:', !!session, session?.userId);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { name, description, type, goal, metric, startDate, endDate, participants, teams } = body;

    if (!name || !description || !type || !goal || !metric || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challengeId = randomUUID();
    const allParticipants = [userId, ...(participants || [])];

    const newChallenge = new Challenge({
      challengeId,
      name,
      description,
      type,
      goal,
      metric,
      startDate,
      endDate,
        status: 'active',
        createdBy: userId,
      participants: allParticipants,
      teams: teams || [],
      createdAt: new Date().toISOString()
    });

    await newChallenge.save();

    for (const participantId of allParticipants) {
      const userStats = await UserStats.findOne({ userId: participantId });
      const startEmissions = userStats?.monthlyEmissions || 0;

      const progress = new ChallengeProgress({
        challengeId,
        userId: participantId,
        teamId: teams?.find((t: any) => t.members.includes(participantId))?.teamId,
        startEmissions,
        currentEmissions: startEmissions,
        reductionPercentage: 0,
        lastUpdated: new Date().toISOString()
      });

      await progress.save();
    }

    return NextResponse.json({
      message: 'Challenge created successfully',
      challenge: {
        id: newChallenge._id,
        challengeId: newChallenge.challengeId,
        name: newChallenge.name,
        status: newChallenge.status
      }
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    const session = await (await import('@/db/models')).Session.findOne({ token });
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const challenge = await Challenge.findOne({ challengeId });
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.createdBy !== userId) {
      return NextResponse.json({ error: 'Only the creator can delete this challenge' }, { status: 403 });
    }

    await ChallengeProgress.deleteMany({ challengeId });
    await Challenge.deleteOne({ challengeId });

    return NextResponse.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    const session = await (await import('@/db/models')).Session.findOne({ token });
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { challengeId, action } = body;

    if (!challengeId || !action) {
      return NextResponse.json({ error: 'Challenge ID and action are required' }, { status: 400 });
    }

    const challenge = await Challenge.findOne({ challengeId });
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (action === 'join') {
        if (challenge.participants.some((p: any) => String(p) === String(userId))) {
        return NextResponse.json({ error: 'Already joined' }, { status: 400 });
      }

      challenge.participants.push(userId);
      await challenge.save();

      const userStats = await UserStats.findOne({ userId });
      const startEmissions = userStats?.monthlyEmissions || 0;

      const progress = new ChallengeProgress({
        challengeId,
        userId,
        startEmissions,
        currentEmissions: startEmissions,
        reductionPercentage: 0,
        lastUpdated: new Date().toISOString()
      });

      await progress.save();

      return NextResponse.json({ message: 'Joined challenge successfully' });
    } else if (action === 'leave') {
        challenge.participants = challenge.participants.filter((p: any) => String(p) !== String(userId));
      await challenge.save();
      await ChallengeProgress.deleteOne({ challengeId, userId });
      return NextResponse.json({ message: 'Left challenge successfully' });
    } else if (action === 'start') {
      if (challenge.createdBy !== userId) {
        return NextResponse.json({ error: 'Only creator can start challenge' }, { status: 403 });
      }
      challenge.status = 'active';
      await challenge.save();
      return NextResponse.json({ message: 'Challenge started' });
    } else if (action === 'complete') {
      if (challenge.createdBy !== userId) {
        return NextResponse.json({ error: 'Only creator can complete challenge' }, { status: 403 });
      }

      const allProgress = await ChallengeProgress.find({ challengeId });
      const winner = allProgress.reduce((best, current) => 
        current.reductionPercentage > (best?.reductionPercentage || 0) ? current : best
      );

      challenge.status = 'completed';
      challenge.winner = winner?.userId;
      await challenge.save();

      return NextResponse.json({ 
        message: 'Challenge completed',
        winner: winner?.userId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}
