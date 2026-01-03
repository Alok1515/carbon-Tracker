import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/connectDB';
import { User } from '@/db/models';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const regex = new RegExp(query, 'i');

    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    if (!db) return NextResponse.json({ error: 'Database not connected' }, { status: 500 });

    // Combine and deduplicate by ID
    const results = new Map();

    // 1. Search in 'user' collection (primary)
    const usersSingular = await db.collection('user').find({
      $and: [
        { _id: { $ne: session.userId } },
        { name: { $regex: regex } }
      ]
    }).limit(10).toArray();

    usersSingular.forEach(u => {
      results.set(u._id.toString(), {
        id: u._id.toString(),
        name: u.name,
        image: u.image
      });
    });

    // 2. Search in 'users' collection (legacy/plural)
    const usersPlural = await db.collection('users').find({
      $and: [
        { _id: { $ne: session.userId } },
        { name: { $regex: regex } }
      ]
    }).limit(10).toArray();

    usersPlural.forEach(u => {
      if (!results.has(u._id.toString())) {
        results.set(u._id.toString(), {
          id: u._id.toString(),
          name: u.name,
          image: u.image
        });
      }
    });

    // 3. Search in UserProfile for displayNames
    const profiles = await (await import('@/db/models')).UserProfile.find({
      $and: [
        { userId: { $ne: session.userId } },
        { displayName: { $regex: regex } }
      ]
    }).limit(10);

    // Add profiles (they might have different display names)
    for (const p of profiles) {
      if (!results.has(p.userId)) {
        // Find the base user to get the image if not in profile
        const u = await User.findById(p.userId).select('image');
        results.set(p.userId, {
          id: p.userId,
          name: p.displayName || p.name,
          image: u?.image
        });
      }
    }

    return NextResponse.json(Array.from(results.values()));
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
