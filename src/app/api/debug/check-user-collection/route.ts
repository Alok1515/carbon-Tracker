import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchName = searchParams.get('search');

    // Connect to MongoDB
    const connection = await connectToDatabase();
    const db = connection.connection.db;

    if (!db) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          code: 'DB_CONNECTION_FAILED' 
        },
        { status: 500 }
      );
    }

    // Access the 'user' collection (singular)
    const userCollection = db.collection('user');

    // Get total count of users
    const totalUsers = await userCollection.countDocuments();

    // Get all users (limited to first 50)
    const allUsers = await userCollection
      .find({})
      .limit(50)
      .toArray();

    // Search for specific users (mango and alok) or custom search
    let searchedUsers;
    if (searchName) {
      searchedUsers = await userCollection
        .find({ 
          name: { 
            $regex: searchName, 
            $options: 'i' 
          } 
        })
        .toArray();
    } else {
      searchedUsers = await userCollection
        .find({ 
          name: { 
            $in: ['mango', 'alok'] 
          } 
        })
        .toArray();
    }

    // Format response
    const response = {
      totalUsers,
      allUsers: allUsers.map(user => ({
        id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      searchedUsers: searchedUsers.map(user => ({
        id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      searchQuery: searchName || 'mango, alok',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
        code: 'INTERNAL_SERVER_ERROR',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}