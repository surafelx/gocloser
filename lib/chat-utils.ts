import { Message } from "@/types";

/**
 * Generates a title for a chat based on its content
 * @param messages Array of chat messages
 * @returns A generated title string
 */
export async function generateChatTitle(messages: Message[]): Promise<string> {
  // Need at least one user message to generate a title
  const userMessages = messages.filter(msg => msg.role === "user");
  
  if (userMessages.length === 0) {
    return "New Chat";
  }
  
  // For simple cases, use the first user message
  if (userMessages.length === 1) {
    const firstMessage = userMessages[0].content.trim();
    
    // If the message is short enough, use it directly
    if (firstMessage.length <= 30) {
      return firstMessage;
    }
    
    // Otherwise truncate it
    return firstMessage.substring(0, 27) + "...";
  }
  
  // For more complex conversations, use AI to generate a title
  try {
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(0, 5) }) // Use first 5 messages for context
    });
    
    if (!response.ok) throw new Error('Failed to generate title');
    
    const data = await response.json();
    return data.title || "Chat " + new Date().toLocaleDateString();
  } catch (error) {
    console.error('Error generating title:', error);
    
    // Fallback to using the first message
    const firstUserMessage = userMessages[0].content.trim();
    return firstUserMessage.substring(0, 27) + "...";
  }
}

/**
 * Updates a chat's title automatically when needed
 * @param chatId The ID of the chat to update
 * @param messages The messages in the chat
 * @param currentTitle The current title of the chat
 */
export async function updateChatTitleIfNeeded(
  chatId: string, 
  messages: Message[], 
  currentTitle: string = "New Chat"
): Promise<string | null> {
  // Only generate a new title if:
  // 1. Current title is the default "New Chat"
  // 2. We have at least 2 messages (1 user, 1 assistant)
  // 3. The first user message is not empty
  
  if (
    currentTitle !== "New Chat" || 
    messages.length < 2 ||
    !messages.some(msg => msg.role === "user")
  ) {
    return null;
  }
  
  try {
    const newTitle = await generateChatTitle(messages);
    
    // Update the title in the database
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    });
    
    if (!response.ok) throw new Error('Failed to update chat title');
    
    return newTitle;
  } catch (error) {
    console.error('Error updating chat title:', error);
    return null;
  }
}