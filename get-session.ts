import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || '';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const session = await db.collection('session').findOne({});
    console.log('Valid Session Token:', session?.token);
    const user = await db.collection('user').findOne({});
    console.log('Sample User ID:', user?._id);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
