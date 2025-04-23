import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Chat from '@/models/Chat';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';

// Get a specific chat by ID
export async function GET(
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

    // Transform MongoDB document to expected format
    const formattedChat = {
      id: chat._id.toString(),
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };

    return NextResponse.json({
      success: true,
      chat: formattedChat,
    });
  } catch (error: any) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching chat' },
      { status: 500 }
    );
  }
}

// Update a chat
export async function PUT(
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
    const { title, messages } = await request.json();

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

    // Update the chat
    if (title !== undefined) {
      chat.title = title;
    }
    if (messages !== undefined) {
      chat.messages = messages;
    }

    await chat.save();

    // Transform MongoDB document to expected format
    const formattedChat = {
      id: chat._id.toString(),
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };

    return NextResponse.json({
      success: true,
      chat: formattedChat,
    });
  } catch (error: any) {
    console.error('Update chat error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating chat' },
      { status: 500 }
    );
  }
}

// Delete a chat
export async function DELETE(
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

    // Find and delete the chat by ID and user ID
    const result = await Chat.deleteOne({
      _id: chatId,
      userId: currentUser.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting chat' },
      { status: 500 }
    );
  }
}
