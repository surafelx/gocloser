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
    const prompt = `Based on this conversation, generate a very short, concise title (maximum 5 words) that captures the main topic. Don't use quotes or special characters. The title should be simple and descriptive. Here's the conversation: ${userMessages}`;

    console.log('Generating title for chat...');
    const result = await generateGeminiResponse(prompt, [], 'chat');

    if (!result.success) {
      console.error('Title generation failed:', result);
      // Provide a fallback title based on the first message
      const firstMessage = messages.find(msg => msg.role === 'user')?.content || '';
      const fallbackTitle = firstMessage.split(' ').slice(0, 3).join(' ') + '...';
      return NextResponse.json({ title: fallbackTitle });
    }

    // Clean up the title (remove quotes, limit length)
    let title = result.response.replace(/["']/g, '').trim();

    // Remove any special characters that might cause issues
    title = title.replace(/[^\w\s]/g, '');

    // If title is empty after cleaning, use a fallback
    if (!title.trim()) {
      const firstMessage = messages.find(msg => msg.role === 'user')?.content || '';
      title = firstMessage.split(' ').slice(0, 3).join(' ') + '...';
    }

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
