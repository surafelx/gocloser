import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateGeminiResponse } from '@/app/actions/gemini-actions';

export async function POST(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the messages from the request body
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    // Extract the first few user messages to generate a title
    const userMessages = messages
      .filter(msg => msg.role === 'user')
      .slice(0, 3)
      .map(msg => msg.content)
      .join(' ');

    if (!userMessages) {
      return NextResponse.json(
        { title: 'New Chat' }
      );
    }

    // Generate a title using Gemini
    const prompt = `Based on this conversation, generate a very short, concise title (maximum 5 words) that captures the main topic. Don't use quotes. Here's the conversation: ${userMessages}`;
    
    const result = await generateGeminiResponse(prompt, [], 'chat');

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate title' },
        { status: 500 }
      );
    }

    // Clean up the title (remove quotes, limit length)
    let title = result.response.replace(/["']/g, '').trim();
    
    // Limit to 5 words
    const words = title.split(' ');
    if (words.length > 5) {
      title = words.slice(0, 5).join(' ');
    }

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error('Generate title error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating title' },
      { status: 500 }
    );
  }
}
