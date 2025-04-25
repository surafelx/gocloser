import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Chat from "@/models/Chat";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

// Get all chats for the current user
export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(currentUser.userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Find all chats for the user
    const chats = await Chat.find({
      userId: new mongoose.Types.ObjectId(currentUser.userId),
    })
      .sort({ updatedAt: -1 })
      .select("_id title updatedAt messages")
      .lean();

    return NextResponse.json({
      success: true,
      chats,
    });
  } catch (error: any) {
    console.error("Get chats error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching chats" },
      { status: 500 }
    );
  }
}

// Create a new chat
export async function POST(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Parse the request body
    const { title, messages } = await request.json();
    console.log('Creating new chat with title:', title, 'and messages:', messages);

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(currentUser.userId)) {
      console.error('Invalid user ID format:', currentUser.userId);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Create a new chat
    const chat = await Chat.create({
      userId: new mongoose.Types.ObjectId(currentUser.userId),
      title: title || "New Chat",
      messages: messages || [],
    });

    console.log('Chat created successfully:', chat._id, 'with', chat.messages.length, 'messages');

    return NextResponse.json(
      {
        success: true,
        chat: {
          id: chat._id,
          title: chat.title,
          messages: chat.messages,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create chat error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating chat" },
      { status: 500 }
    );
  }
}
