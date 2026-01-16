import { connectToDatabase } from './mongodb';

export async function connectDB() {
  return connectToDatabase();
}

export default connectDB;
