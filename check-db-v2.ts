import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || '';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Collections:', collectionNames);

    if (collectionNames.includes('users')) {
      const user = await db.collection('users').findOne({});
      console.log('Sample from "users":', {
        _id: user?._id,
        _id_type: typeof user?._id,
        isObjectId: user?._id instanceof ObjectId,
        id: (user as any).id,
        name: user?.name
      });
    }

    if (collectionNames.includes('user')) {
      const user = await db.collection('user').findOne({});
      console.log('Sample from "user":', {
        _id: user?._id,
        _id_type: typeof user?._id,
        isObjectId: user?._id instanceof ObjectId,
        id: (user as any).id,
        name: user?.name
      });
    }

    // List all users to see if we can find the one the user might be trying to add
    if (collectionNames.includes('users')) {
       const allUsers = await db.collection('users').find({}).limit(5).toArray();
       console.log('First 5 users in "users":', allUsers.map(u => ({ _id: u._id, name: u.name, id: (u as any).id })));
    }

  } finally {
    await client.close();
  }
}

run().catch(console.error);
