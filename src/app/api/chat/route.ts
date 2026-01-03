import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/db/mongodb"
import { Message, Session } from "@/db/models"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    await connectToDatabase()
    const session = await Session.findOne({ token })
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.userId
    const { searchParams } = new URL(req.url)
    const friendId = searchParams.get("friendId")

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID required" }, { status: 400 })
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 })

    // Mark messages sent by friend to user as read
    await Message.updateMany(
      { senderId: friendId, receiverId: userId, read: false },
      { $set: { read: true } }
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Chat GET error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    await connectToDatabase()
    const session = await Session.findOne({ token })
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.userId
    const { receiverId, content } = await req.json()

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const message = await Message.create({
      senderId: userId,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
      read: false
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Chat POST error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
