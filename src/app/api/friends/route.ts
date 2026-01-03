import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/mongodb';
import { Friend, User, Message } from '@/db/models';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectToDatabase();

    const session = await (await import('@/db/models')).Session.findOne({ token });
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'accepted';

    const friends = await Friend.find({
      $or: [{ userId }, { friendId: userId }],
      status
    });

    const friendIds = friends.map(f => 
       f.userId.toString() === userId.toString() ? f.friendId : f.userId
    );

    const mongoose = await import('mongoose');
    const processedFriendIds = friendIds.map(id => {
      try {
        const strId = id.toString();
        return /^[0-9a-fA-F]{24}$/.test(strId) ? [strId, new mongoose.Types.ObjectId(strId)] : [strId];
      } catch {
        return [id.toString()];
      }
    }).flat();

    // Fetch users from both 'users' and 'user' collections to be sure
    const db = mongoose.connection.db;
    if (!db) {
       return NextResponse.json({ error: 'Database connection lost' }, { status: 500 });
    }

    const usersPlural = await db.collection('users').find({
      $or: [
        { _id: { $in: processedFriendIds } },
        { id: { $in: processedFriendIds } }
      ]
    }).toArray();

    const usersSingular = await db.collection('user').find({
      $or: [
        { _id: { $in: processedFriendIds } },
        { id: { $in: processedFriendIds } }
      ]
    }).toArray();

    const allUsers = [...usersPlural, ...usersSingular];
    
    // Fetch unread message counts
    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: userId, read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);

    const unreadMap = unreadCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);
    
    const friendsData = friends.map(f => {
      const targetFriendId = (f.userId.toString() === userId.toString()) ? f.friendId : f.userId;
      const friendIdStr = targetFriendId.toString();
      
      const user = allUsers.find(u => 
        u._id.toString() === friendIdStr || (u as any).id === friendIdStr
      );
        return {
          id: f._id,
          userId: targetFriendId,
          name: user?.name || 'Unknown User',
          image: user?.image,
          status: f.status,
          requestedBy: f.requestedBy,
          createdAt: f.createdAt,
          acceptedAt: f.acceptedAt,
          isIncoming: f.requestedBy.toString() !== userId.toString() && f.status === 'pending',
          unreadCount: unreadMap[friendIdStr] || 0
        };
    });

    return NextResponse.json(friendsData);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectToDatabase();

    const session = await (await import('@/db/models')).Session.findOne({ token });
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { friendId } = body;

    console.log('--- Send Friend Request ---');
    console.log('Current User ID:', userId);
    console.log('Target Friend ID:', friendId);

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    // Find the friend
    let friend;
    const mongoose = await import('mongoose');
    const isHex = /^[0-9a-fA-F]{24}$/.test(friendId);
    
    // Try finding in 'users' collection first (since search results seem to come from there)
    const db = mongoose.connection.db;
    if (!db) {
       return NextResponse.json({ error: 'Database connection lost' }, { status: 500 });
    }

    // Check 'users' collection
    const queryUsers = {
      $or: [
        { _id: friendId },
        { id: friendId }
      ]
    };
    if (isHex) {
      (queryUsers.$or as any[]).push({ _id: new mongoose.Types.ObjectId(friendId) });
    }

    console.log('Querying "users" (plural) collection with:', JSON.stringify(queryUsers));
    friend = await db.collection('users').findOne(queryUsers);
    
    if (!friend) {
      console.log('Not found in "users", checking "user" (singular)');
      friend = await db.collection('user').findOne(queryUsers);
    }

    if (!friend) {
      console.log('User not found in either "users" or "user" collections');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('Friend found:', friend.name, '(_id:', friend._id, ')');

    if (friend._id.toString() === userId.toString()) {
      return NextResponse.json({ error: 'Cannot add yourself as friend' }, { status: 400 });
    }

    const friendIdResolved = friend._id.toString();

    const existingFriendship = await Friend.findOne({
      $or: [
        { userId, friendId: friendIdResolved },
        { userId: friendIdResolved, friendId: userId }
      ]
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }

    const newFriend = new Friend({
      userId,
      friendId: friendIdResolved,
      status: 'pending',
      requestedBy: userId,
      createdAt: new Date().toISOString()
    });

    await newFriend.save();

    return NextResponse.json({
      message: 'Friend request sent',
      friend: {
        id: newFriend._id,
        userId: friendIdResolved,
        name: friend.name,
        image: friend.image,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectToDatabase();

    const session = await (await import('@/db/models')).Session.findOne({ token });
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { friendshipId, action } = body;

    if (!friendshipId || !action) {
      return NextResponse.json({ error: 'Friendship ID and action are required' }, { status: 400 });
    }

    const friendship = await Friend.findById(friendshipId);
    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    if (friendship.userId !== userId && friendship.friendId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      if (friendship.requestedBy === userId) {
        return NextResponse.json({ error: 'Cannot accept your own request' }, { status: 400 });
      }
      friendship.status = 'accepted';
      friendship.acceptedAt = new Date().toISOString();
      await friendship.save();
      return NextResponse.json({ message: 'Friend request accepted' });
    } else if (action === 'reject' || action === 'remove') {
      await Friend.findByIdAndDelete(friendshipId);
      return NextResponse.json({ message: 'Friendship removed' });
    } else if (action === 'block') {
      friendship.status = 'blocked';
      await friendship.save();
      return NextResponse.json({ message: 'User blocked' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating friendship:', error);
    return NextResponse.json({ error: 'Failed to update friendship' }, { status: 500 });
  }
}
