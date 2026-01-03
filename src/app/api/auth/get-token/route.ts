import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import connectDB from '@/db/connectDB';
import { Session } from '@/db/models';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    console.log('get-token: session:', session?.user?.id);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    await connectDB();
    
    // Check if user already has a valid session token
    let existingSession = await Session.findOne({ 
      userId: session.user.id,
      expiresAt: { $gt: new Date() }
    });

      if (existingSession) {
        console.log('get-token: returning existing token:', existingSession.token?.substring(0, 20) + '...');
        return NextResponse.json({ token: existingSession.token });
      }

      // Create a new bearer token for this user
      const bearerToken = randomUUID();
      console.log('get-token: creating new token:', bearerToken.substring(0, 20) + '...');

      const newSession = await Session.findOneAndUpdate(
        { userId: session.user.id },
        {
          $set: {
            userId: session.user.id,
            token: bearerToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            ipAddress: session.session?.ipAddress,
            userAgent: session.session?.userAgent,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      console.log('get-token: token created and saved:', newSession.token?.substring(0, 20) + '...');
      return NextResponse.json({ token: newSession.token });
  } catch (error) {
    console.error('Error fetching bearer token:', error);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
