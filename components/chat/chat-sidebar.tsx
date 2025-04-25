"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  Search,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/contexts/chat-context";
import AnimatedElement from "@/components/animated-element";

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { createChat, setCurrentChatId, generateTitle, updateChat } = useChat();

  const [isOpen, setIsOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  // Fetch chat history
  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch chats from the API
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch chats");
      }

      // Transform the data to match our Chat interface and filter out empty chats
      const formattedChats: Chat[] = data.chats
        .filter((chat: any) => {
          // Only include chats that have more than 1 message (more than just the welcome message)
          // or chats that have at least one user message
          return (
            chat.messages &&
            (chat.messages.length > 1 ||
              chat.messages.some((msg: any) => msg.role === "user"))
          );
        })
        .map((chat: any) => {
          // Find the first user message to use for preview

          const userMessage = chat.messages.find(
            (msg: any) => msg.role === "user"
          );
          const lastMessage = chat.messages[chat.messages.length - 1];

          return {
            id: chat._id,
            title: chat.title,
            updatedAt: chat.updatedAt,
            // Use the first user message as preview or the last message if no user message exists
            preview: userMessage
              ? userMessage.content.substring(0, 50) +
                (userMessage.content.length > 50 ? "..." : "")
              : lastMessage
              ? lastMessage.content.substring(0, 50) +
                (lastMessage.content.length > 50 ? "..." : "")
              : "No inputs",
          };
        });

      setChats(formattedChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Failed to load chat history",
        description: "Please try again later.",
        variant: "destructive",
      });
      // Set empty chats array on error
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle new chat
  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      // Create a new chat with default welcome message
      const initialMessage = {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hi there! I'm your AI sales coach. You can chat with me about sales techniques, upload sales calls for analysis, or practice your pitch. How can I help you today?",
      };

      // Create a new chat with the welcome message
      const chatId = await createChat("New Chat", [initialMessage]);

      // Refresh the chat list
      await fetchChats();

      // Navigate to the specific chat page with the new chat ID
      if (chatId) {
        // Set the current chat ID in the context
        console.log('Setting current chat ID for new chat:', chatId);
        setCurrentChatId(chatId);

        router.push(`/chat/${chatId}`);
      } else {
        // If no chatId was returned, just go to the main chat page
        router.push("/chat");
      }

      toast({
        title: "New chat created",
        description: "You can now start a new conversation.",
      });
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Failed to create new chat",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat selection
  const handleSelectChat = async (chatId: string) => {
    try {
      console.log('Selecting chat with ID:', chatId);
      setIsLoading(true);
      // Verify chat exists before navigation
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) {
        throw new Error('Chat not found');
      }

      // Get the chat data for logging
      const data = await response.json();

      if (!data.chat || !data.chat.id) {
        console.error('Invalid chat data format:', data);
        throw new Error('Invalid chat data format');
      }

      // Set the current chat ID in the context
      console.log('Setting current chat ID in sidebar:', chatId);
      setCurrentChatId(chatId);

      // Navigate to the chat page
      console.log('Navigating to chat page with ID:', chatId);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error selecting chat:', error);
      toast({
        title: 'Failed to load chat',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      // Call the API to delete the chat
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete chat");
      }

      // Refresh the chat list
      await fetchChats();

      toast({
        title: "Chat deleted",
        description: "The chat has been deleted successfully.",
      });

      // If we're currently viewing the deleted chat, redirect to new chat
      if (pathname === `/chat/${chatId}`) {
        // Clear the current chat ID in the context
        console.log('Clearing current chat ID after deletion');
        setCurrentChatId(null);

        router.push("/chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Failed to delete chat",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  // Handle chat edit
  const handleEditChat = async (chatId: string, newTitle: string) => {
    try {
      setIsLoading(true);
      // Call the API to update the chat title
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename chat");
      }

      // Refresh the chat list
      await fetchChats();

      toast({
        title: "Chat renamed",
        description: "The chat has been renamed successfully.",
      });
    } catch (error) {
      console.error("Error editing chat:", error);
      toast({
        title: "Failed to rename chat",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setEditingChatId(null);
      setEditTitle("");
    }
  };

  // Generate a title for a chat using AI
  const handleGenerateTitle = async (chatId: string) => {
    try {
      setIsLoading(true);

      // First, get the chat messages
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load chat");
      }

      const data = await response.json();
      const chatMessages = data.chat.messages;

      // Generate a title using the Gemini API
      const newTitle = await generateTitle(chatMessages);

      if (newTitle === 'New Chat') {
        toast({
          title: "Could not generate title",
          description: "Not enough context to generate a meaningful title.",
          variant: "destructive",
        });
        return;
      }

      // Update the chat with the new title
      await updateChat(newTitle);

      // Refresh the chat list
      await fetchChats();

      toast({
        title: "Title generated",
        description: `Chat renamed to "${newTitle}"`
      });
    } catch (error) {
      console.error("Error generating title:", error);
      toast({
        title: "Failed to generate title",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      // Format as MM/DD/YYYY for dates older than 24 hours
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`flex flex-col h-full border-r border-border/40 bg-background/80 backdrop-blur transition-all duration-300 ${
        isOpen ? "w-80" : "w-0"
      }`}
    >
      {isOpen && (
        <AnimatedElement type="fade-in" duration={300}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <span className="text-primary animate-pulse-glow">
                  GoCloser
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="md:hidden"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="px-4 pb-2">
              <Button
                variant="gradient"
                className="w-full justify-start gap-2 rounded-lg"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            {/* Search */}
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  className="pl-9 bg-accent/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Separator className="my-2" />

            {/* Chat List */}
            <ScrollArea className="flex-1 px-2">
              {isLoading ? (
                <div className="flex flex-col gap-2 px-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg bg-accent/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredChats.length > 0 ? (
                <div className="flex flex-col gap-1 px-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent/50 ${
                        pathname === `/chat/${chat.id}` ? "bg-accent" : ""
                      }`}
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <div className="flex-1 min-w-0 cursor-pointer">
                        {editingChatId === chat.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditChat(chat.id, editTitle);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex gap-1"
                          >
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button type="submit" size="sm" variant="ghost">
                              Save
                            </Button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                              <p className="font-medium truncate">
                                {chat.title}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {chat.preview}
                            </p>
                          </>
                        )}
                      </div>

                      {editingChatId !== chat.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateTitle(chat.id);
                                  }}
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Generate AI title</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.id);
                              setEditTitle(chat.title);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatToDelete(chat.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No chats found</p>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Try a different search term
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* User Profile */}
            <div className="p-4 border-t border-border/40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 rounded-lg"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={user?.profilePicture}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback>
                        {user?.name ? user.name.split(' ')[0][0].toUpperCase() + (user.name.split(' ')[1]?.[0]?.toUpperCase() || '') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user?.name || "Guest"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </AnimatedElement>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
