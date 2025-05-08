'use server';

import dbConnect from "@/lib/mongoose";
import Chat from "@/models/Chat";
import { generateGeminiResponse } from "./gemini-actions";

/**
 * Updates all chats with "New Chat" titles to have auto-generated titles
 * @param userId The user ID to update chats for
 * @returns Object with count of updated chats and any error message
 */
export async function updateAllChatTitles(userId: string) {
  try {
    console.log(`Starting batch update of chat titles for user ${userId}`);
    
    // Connect to the database
    await dbConnect();
    
    // Find all chats with "New Chat" title
    const chats = await Chat.find({
      userId,
      title: "New Chat",
    }).lean();
    
    console.log(`Found ${chats.length} chats with "New Chat" title`);
    
    if (chats.length === 0) {
      return { 
        success: true, 
        updatedCount: 0, 
        message: "No chats with default titles found" 
      };
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each chat
    for (const chat of chats) {
      try {
        // Skip chats with no user messages
        const userMessages = chat.messages.filter(msg => msg.role === 'user');
        if (userMessages.length === 0) {
          console.log(`Skipping chat ${chat._id} - no user messages`);
          continue;
        }
        
        // Extract the first few user messages to generate a title
        const messageContent = userMessages
          .slice(0, 3)
          .map(msg => msg.content)
          .join(' ');
        
        // Generate a title using Gemini
        const prompt = `Based on this conversation, generate a very short, concise title (maximum 5 words) that captures the main topic. Don't use quotes or special characters. The title should be simple and descriptive. The title should be specific to the conversation content, not generic like "Sales Discussion" or "Chat Conversation". Here's the conversation: ${messageContent}`;
        
        console.log(`Generating title for chat ${chat._id}...`);
        const result = await generateGeminiResponse(prompt, [], 'chat');
        
        if (!result.success) {
          console.error(`Title generation failed for chat ${chat._id}:`, result);
          errorCount++;
          continue;
        }
        
        // Clean up the title (remove quotes, limit length)
        let title = result.response.replace(/["']/g, '').trim();
        
        // Remove any special characters that might cause issues
        title = title.replace(/[^\w\s]/g, '');
        
        // If title is empty after cleaning, use a fallback
        if (!title.trim()) {
          const firstMessage = userMessages[0].content || '';
          title = firstMessage.split(' ').slice(0, 3).join(' ') + '...';
        }
        
        // Limit to 5 words
        const words = title.split(' ');
        if (words.length > 5) {
          title = words.slice(0, 5).join(' ');
        }
        
        // Update the chat title
        await Chat.updateOne(
          { _id: chat._id },
          { $set: { title } }
        );
        
        console.log(`Updated chat ${chat._id} title to: ${title}`);
        updatedCount++;
      } catch (chatError) {
        console.error(`Error processing chat ${chat._id}:`, chatError);
        errorCount++;
      }
    }
    
    return { 
      success: true, 
      updatedCount, 
      errorCount,
      message: `Updated ${updatedCount} chat titles. ${errorCount > 0 ? `Failed to update ${errorCount} chats.` : ''}`
    };
  } catch (error) {
    console.error('Error updating chat titles:', error);
    return { 
      success: false, 
      updatedCount: 0, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}
