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

    // Check if this is a user message and if the chat title is still "New Chat"
    // If so, and we have at least 2 user messages, trigger title generation
    if (
      message.role === 'user' &&
      chat.title === "New Chat" &&
      chat.messages.filter(msg => msg.role === 'user').length >= 2
    ) {
      try {
        // Get user messages for title generation
        const userMessages = chat.messages.filter(msg => msg.role === 'user').slice(0, 3);

        // Only proceed if we have enough content
        if (userMessages.length >= 2) {
          console.log('Triggering automatic title generation for chat:', chatId);

          // Call the title generation API
          const titleResponse = await fetch(new URL('/api/chats/generate-title', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chat.messages }),
          });

          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            if (titleData.title && titleData.title !== "New Chat") {
              // Update the chat title
              chat.title = titleData.title;
              await chat.save();
              console.log('Chat title automatically updated to:', titleData.title);
            }
          }
        }
      } catch (titleError) {
        // Don't fail the main request if title generation fails
        console.error('Error generating title automatically:', titleError);
      }
    }

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
