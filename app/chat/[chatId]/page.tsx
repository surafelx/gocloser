"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/contexts/chat-context"
import ChatPage from "../page"
import mongoose from "mongoose"

export default function ChatWithId({ params }: { params: { chatId: string } }) {
  const router = useRouter()
  const chatId = params.chatId

  // Validate if the ID is a valid MongoDB ObjectId
  const isValidId = mongoose.Types.ObjectId.isValid(chatId)

  // If the ID is not valid, redirect to the main chat page
  useEffect(() => {
    if (!isValidId) {
      console.error("Invalid chat ID format:", chatId)
      router.push("/chat")
      return
    }
  }, [chatId, isValidId, router])

  // Use the chat context
  const { error, chat, setCurrentChatId } = useChat()

  // Set the current chat ID when the component mounts - with strict controls to prevent infinite loops
  // The actual loading will be handled by the useChatStorage hook
  const chatIdSetRef = useRef<boolean>(false);

  useEffect(() => {
    // STRICT CONTROL: Check if this component has already set a chat ID in this session
    if (chatIdSetRef.current) {
      console.log('[LOOP-PREVENTION] ChatId already set in this component instance, preventing reset');
      return;
    }

    // Check if we've already set this chat ID in this browser session
    const currentChatIdKey = `current_chat_id_${chatId}`;
    const chatIdAlreadySet = sessionStorage.getItem(currentChatIdKey);

    if (isValidId && chatId && !chatIdAlreadySet) {
      console.log('[CHAT-ID] Setting current chat ID:', chatId);

      // Mark that we've set this chat ID in this component instance
      chatIdSetRef.current = true;

      // Mark that we've set this chat ID in this browser session
      sessionStorage.setItem(currentChatIdKey, 'true');

      // Use a longer timeout to break potential circular dependencies
      setTimeout(() => {
        setCurrentChatId(chatId);
      }, 1000);
    } else if (chatIdAlreadySet) {
      console.log('[CHAT-ID] Chat ID already set in this session, skipping');
    }
  }, [isValidId, chatId, setCurrentChatId]) // Include dependencies to satisfy TypeScript, but the effect has internal guards

  // Log the chat data for debugging
  useEffect(() => {
    if (chat) {
      console.log('Loaded chat:', chat);
    }
  }, [chat])

  // If there's an error loading the chat, redirect to the main chat page
  useEffect(() => {
    if (error) {
      console.error("Error loading chat:", error)
      router.push("/chat")
    }
  }, [error, router])

  // Render the main chat page
  // The chat will be loaded by the useChatStorage hook
  return <ChatPage />
}
