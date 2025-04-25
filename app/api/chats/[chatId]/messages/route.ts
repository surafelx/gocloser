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
    console.log('Adding message to chat:', chatId, 'Message:', message);

    // Find the chat by ID and user ID
    console.log('Looking for chat with ID:', chatId, 'and userId:', currentUser.userId);
    const chat = await Chat.findOne({
      _id: chatId,
      userId: currentUser.userId,
    });

    if (!chat) {
      console.error('Chat not found for ID:', chatId, 'and userId:', currentUser.userId);
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    console.log('Found chat:', chat.id, 'with', chat.messages.length, 'messages');

    // Add the message to the chat
    chat.messages.push(message);
    await chat.save();
    console.log('Message added successfully, chat now has', chat.messages.length, 'messages');

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
