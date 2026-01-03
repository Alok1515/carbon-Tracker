import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const userId = searchParams.get("userId"); // Optional: to exclude current user when updating

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db();
    
    // Check Better-Auth collections ('user' and 'users')
    const userCol = db.collection("user");
    const usersCol = db.collection("users");
    // Check our custom UserProfile collection
    const profileCol = db.collection("userprofiles");

    const nameQuery: any = {
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    };

    const displayNameQuery: any = {
      displayName: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    };

    if (userId) {
      nameQuery.id = { $ne: userId };
      // UserProfile uses userId field instead of id
      displayNameQuery.userId = { $ne: userId };
    }

    const existingUser = await userCol.findOne(nameQuery) || await usersCol.findOne(nameQuery);
    const existingProfile = await profileCol.findOne(displayNameQuery);

    return NextResponse.json({ exists: !!existingUser || !!existingProfile });
  } catch (error) {
    console.error("Error checking name uniqueness:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await client.close();
  }
}
