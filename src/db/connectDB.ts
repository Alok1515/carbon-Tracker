import { connectToDatabase } from './mongodb'

// Thin wrapper for backward compatibility
export default async function connectDB() {
  return connectToDatabase()
}

export { connectToDatabase }
