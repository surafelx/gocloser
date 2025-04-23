import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Chat from '@/models/Chat';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

// Add a message to a chat
export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Await params before using its properties
    const resolvedParams = await params;
    const chatId = resolvedParams.chatId;

    // Validate the chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: 'Invalid chat ID format' },
        { status: 400 }
      );
    }

    // Parse the request body
    const message = await request.json();

    // Find the chat by ID and user ID
    const chat = await Chat.findOne({
      _id: chatId,
      userId: currentUser.userId,
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Add the message to the chat
    chat.messages.push(message);
    await chat.save();

    return NextResponse.json({
      success: true,
      message,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add message error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while adding message' },
      { status: 500 }
    );
  }
}
