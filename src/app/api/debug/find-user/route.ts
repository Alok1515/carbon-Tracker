import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'nextjs-app';

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (!name && !email) {
      return NextResponse.json(
        { 
          error: 'At least one search parameter (name or email) is required',
          code: 'MISSING_SEARCH_PARAMETER'
        },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    const searchConditions = [];

    if (name) {
      searchConditions.push({
        name: { $regex: name, $options: 'i' }
      });
    }

    if (email) {
      searchConditions.push({
        email: { $regex: email, $options: 'i' }
      });
    }

    const query = searchConditions.length > 1 
      ? { $or: searchConditions }
      : searchConditions[0];

    const users = await usersCollection.find(query).toArray();

    return NextResponse.json({
      count: users.length,
      users: users
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'DATABASE_ERROR'
      },
      { status: 500 }
    );
  }
}