import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();
 
export const auth = betterAuth({
	database: mongodbAdapter(db, {
		client
	}),
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	trustedOrigins: ["http://localhost:3000", "http://localhost:3001", "http://192.168.137.1:3000", "http://192.168.1.6:3000"],
	emailAndPassword: {    
		enabled: true
	},
	user: {
		deleteUser: {
			enabled: true
		},
		changeEmail: {
			enabled: true
		}
	},
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}