"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ChevronRight,
  ChevronLeft,
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
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/contexts/chat-context";
import AnimatedElement from "@/components/animated-element";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSpinner } from "@/components/chat/loading-spinner";

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
  messages?: any[]; // Optional messages property for title generation
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { createChat, setCurrentChatId, generateTitle, updateChat } = useChat();
  const isMobile = useIsMobile();

  const [isOpen, setIsOpen] = useState(!isMobile); // Closed by default on mobile
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [generatingTitleForChats, setGeneratingTitleForChats] = useState<string[]>([]);
  const [isUpdatingAllTitles, setIsUpdatingAllTitles] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Update isOpen state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  // Fetch chat history
  const fetchChats = async () => {
    try {
      setIsLoading(true);
      // Fetch chats from the API
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch chats");
      }

      // Transform the data to match our Chat interface
      const formattedChats: Chat[] = data.chats
        .filter((chat: any) => {
          // Only include chats that have more than 1 message or at least one user message
          return (
            chat.messages &&
            (chat.messages.length > 1 ||
              chat.messages.some((msg: any) => msg.role === "user"))
          );
        })
        .map((chat: any) => ({
          id: chat._id,
          title: chat.title,
          updatedAt: chat.updatedAt,
          preview: "",
        }));

      setChats(formattedChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Failed to load chat history",
        description: "Please try again later.",
        variant: "destructive",
      });
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle new chat
  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      const initialMessage = {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hi there! I'm your AI sales coach. You can chat with me about sales techniques, upload sales calls for analysis, or practice your pitch. How can I help you today?",
      };

      // Create a new chat with the initial welcome message
      const chatId = await createChat("New Chat", [initialMessage]);
      await fetchChats();

      if (chatId) {
        setCurrentChatId(chatId);
        router.push(`/chat/${chatId}`);
      } else {
        router.push("/chat");
      }

      toast({
        title: "New chat created",
        description: "Start typing to begin your conversation.",
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
      setIsLoading(true);
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) {
        throw new Error("Chat not found");
      }

      const data = await response.json();
      if (!data.chat || !data.chat.id) {
        throw new Error("Invalid chat data format");
      }

      setCurrentChatId(chatId);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error selecting chat:", error);
      toast({
        title: "Failed to load chat",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete chat");
      }

      await fetchChats();

      toast({
        title: "Chat deleted",
        description: "The chat has been deleted successfully.",
      });

      if (pathname === `/chat/${chatId}`) {
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
      setGeneratingTitleForChats((prev) => [...prev, chatId]);

      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load chat");
      }

      const data = await response.json();
      const chatMessages = data.chat.messages;

      const newTitle = await generateTitle(chatMessages);

      if (newTitle === "New Chat") {
        toast({
          title: "Could not generate title",
          description: "Not enough context to generate a meaningful title.",
          variant: "destructive",
        });
        return;
      }

      await updateChat(newTitle);
      await fetchChats();

      toast({
        title: "Title generated",
        description: `Chat renamed to "${newTitle}"`,
      });
    } catch (error) {
      console.error("Error generating title:", error);
      toast({
        title: "Failed to generate title",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTitleForChats((prev) => prev.filter((id) => id !== chatId));
      setIsLoading(false);
    }
  };

  // Update all chat titles that are still "New Chat"
  const handleUpdateAllTitles = async () => {
    try {
      setIsUpdatingAllTitles(true);

      const response = await fetch('/api/chats/update-titles', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update chat titles");
      }

      const data = await response.json();

      // Refresh the chat list
      await fetchChats();

      toast({
        title: "Chat titles updated",
        description: data.message || `Updated ${data.updatedCount} chat titles.`,
      });
    } catch (error) {
      console.error("Error updating all chat titles:", error);
      toast({
        title: "Failed to update chat titles",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAllTitles(false);
    }
  };

  // Get chat time category
  const getChatTimeCategory = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Reset hours to compare just the dates
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);

    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const weekAgoDate = new Date(todayDate);
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);

    const monthAgoDate = new Date(todayDate);
    monthAgoDate.setDate(monthAgoDate.getDate() - 30);

    const chatDate = new Date(date);
    chatDate.setHours(0, 0, 0, 0);

    if (chatDate.getTime() === todayDate.getTime()) {
      return "Today";
    } else if (chatDate.getTime() === yesterdayDate.getTime()) {
      return "Yesterday";
    } else if (chatDate >= weekAgoDate && chatDate < yesterdayDate) {
      return "Previous 7 Days";
    } else if (chatDate >= monthAgoDate && chatDate < weekAgoDate) {
      return "Previous 30 Days";
    } else {
      // For older chats, group by month and year
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  // Group similar chat titles
  const groupSimilarChats = (chats: any[]): Record<string, any[]> => {
    const groups: Record<string, any[]> = {};
    const processedChats = new Set<string>();

    // First pass: find consecutive chats with similar titles
    for (let i = 0; i < chats.length; i++) {
      const chat = chats[i];

      // Skip if already processed
      if (processedChats.has(chat.id)) continue;

      // Get base title (remove numbers and special chars at the end)
      const baseTitle = chat.title.replace(/[#\d]+$/, '').trim();

      // Skip very short titles or "New Chat"
      if (baseTitle.length < 4 || baseTitle === "New Chat") {
        continue;
      }

      // Find similar consecutive chats
      const similarChats = [chat];
      processedChats.add(chat.id);

      // Look ahead for similar titles
      for (let j = i + 1; j < chats.length; j++) {
        const nextChat = chats[j];
        const nextBaseTitle = nextChat.title.replace(/[#\d]+$/, '').trim();

        // Check if titles are similar (same base or one contains the other)
        const isSimilar =
          nextBaseTitle === baseTitle ||
          (baseTitle.includes(nextBaseTitle) && nextBaseTitle.length > 3) ||
          (nextBaseTitle.includes(baseTitle) && baseTitle.length > 3);

        if (isSimilar) {
          similarChats.push(nextChat);
          processedChats.add(nextChat.id);
        } else {
          // Stop if we find a different title
          break;
        }
      }

      // Only create a group if there are multiple similar chats
      if (similarChats.length > 1) {
        const groupKey = `group-${baseTitle}-${i}`;
        groups[groupKey] = similarChats;

        // Initialize expanded state if not already set
        if (expandedGroups[groupKey] === undefined) {
          setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: false // Collapsed by default
          }));
        }
      }
    }

    return groups;
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
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      // For chats within the last week, show the day name
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getDay()];
    } else {
      // For older chats, show the date
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${month}/${day}`;
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
    <>
      {/* Minimized sidebar for mobile - only shows when sidebar is closed */}
      {!isOpen && isMobile && (
        <div className="flex flex-col h-full border-r border-border/40 bg-muted/50 backdrop-blur transition-all duration-300 w-14 absolute left-0 top-12 z-10">
          <div className="flex flex-col h-full">
            {/* Toggle button */}
            <div className="flex justify-center p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* New Chat Button (minimized) */}
            <div className="px-2 pb-2">
              <Button
                variant="gradient"
                className="w-full justify-center rounded-full aspect-square"
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button to show sidebar when completely hidden */}
      {!isOpen && (
        <div className="fixed top-16 left-4 z-40">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shadow-sm h-8 w-8"
                  onClick={() => setIsOpen(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Show chat sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Full sidebar */}
      <div
        className={`flex flex-col h-full border-r border-border/40 bg-muted/50 backdrop-blur transition-all duration-300 ${
          isOpen
            ? isMobile
              ? "w-full sm:w-80 absolute left-0 top-12 z-40 max-h-[calc(100vh-3rem)] overflow-hidden"
              : "w-80"
            : "w-0"
        }`}
      >
        {isOpen && (
          <AnimatedElement
            type="fade-in"
            duration={300}
            className="h-full overflow-hidden relative"
          >
            <div className="flex flex-col h-full max-h-screen overflow-hidden relative">

              {/* Controls */}
              <div className="flex items-center justify-between p-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  {/* Search button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setIsSearchVisible(!isSearchVisible)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {isSearchVisible ? "Hide search" : "Search chats"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* New chat button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={handleNewChat}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">New chat</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Toggle sidebar button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setIsOpen(false)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Hide sidebar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Search input - conditionally visible */}
              {isSearchVisible && (
                <AnimatedElement type="fade-in" duration={200} className="px-3 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search-input"
                      placeholder="Search chats..."
                      className="pl-8 py-1 h-8 text-sm bg-accent/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </AnimatedElement>
              )}



              {/* Chat List */}
              <ScrollArea className="flex-1 px-2 pt-2 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <LoadingSpinner size="lg" text="Loading chats..." />
                  </div>
                ) : filteredChats.length > 0 ? (
                  <div className="flex flex-col gap-2 px-2 pb-16">
                    {(() => {
                      // Group chats by their time categories
                      const chatsByCategory = filteredChats.reduce((acc, chat) => {
                        const category = getChatTimeCategory(chat.updatedAt);
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(chat);
                        return acc;
                      }, {} as Record<string, typeof filteredChats>);

                      // Define the order of categories
                      const categoryOrder = [
                        "Today",
                        "Yesterday",
                        "Previous 7 Days",
                        "Previous 30 Days"
                      ];

                      // Get all categories
                      const allCategories = Object.keys(chatsByCategory);

                      // Sort categories: first the predefined ones, then the rest (months) by date (newest first)
                      const sortedCategories = [
                        ...categoryOrder.filter(cat => allCategories.includes(cat)),
                        ...allCategories
                          .filter(cat => !categoryOrder.includes(cat))
                          .sort((a, b) => {
                            // Extract year and month for comparison
                            const yearA = parseInt(a.split(' ')[1]);
                            const yearB = parseInt(b.split(' ')[1]);

                            if (yearA !== yearB) return yearB - yearA; // Sort by year descending

                            // Get month index
                            const monthNames = [
                              "January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"
                            ];
                            const monthA = monthNames.indexOf(a.split(' ')[0]);
                            const monthB = monthNames.indexOf(b.split(' ')[0]);

                            return monthB - monthA; // Sort by month descending
                          })
                      ];

                      return (
                        <>
                          {sortedCategories.map(category => (
                            <div key={category} className="mb-2">
                              <h3 className="text-xs font-medium text-muted-foreground mb-1 px-2">{category}</h3>
                              <div className="flex flex-col gap-1">
                                {(() => {
                                  // Group similar chats within this category
                                  const categoryChats = chatsByCategory[category];
                                  const chatGroups = groupSimilarChats(categoryChats);
                                  const groupKeys = Object.keys(chatGroups);

                                  // Get IDs of all chats in groups
                                  const groupedChatIds = new Set(
                                    Object.values(chatGroups)
                                      .flat()
                                      .map(chat => chat.id)
                                  );

                                  // Filter out chats that are already in groups
                                  const standaloneChats = categoryChats.filter(
                                    chat => !groupedChatIds.has(chat.id)
                                  );

                                  return (
                                    <>
                                      {/* Render grouped chats */}
                                      {groupKeys.map(groupKey => {
                                        const chats = chatGroups[groupKey];
                                        const baseTitle = chats[0].title.replace(/[#\d]+$/, '').trim();
                                        const isExpanded = expandedGroups[groupKey] || false;

                                        return (
                                          <div key={groupKey} className="mb-1">
                                            {/* Group header */}
                                            <div
                                              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/30 cursor-pointer"
                                              onClick={() => setExpandedGroups(prev => ({
                                                ...prev,
                                                [groupKey]: !isExpanded
                                              }))}
                                            >
                                              <div className="flex items-center gap-1">
                                                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                <p className="font-medium text-sm">
                                                  {baseTitle} <span className="text-xs text-muted-foreground">({chats.length})</span>
                                                </p>
                                              </div>
                                            </div>

                                            {/* Expanded group content */}
                                            {isExpanded && (
                                              <div className="pl-3 border-l-2 border-muted ml-2 mt-1">
                                                {chats.map(chat => (
                                                  <div
                                                    key={chat.id}
                                                    className={`group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50 ${
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
                                                          <div className="flex items-center">
                                                            <p className="font-medium text-sm truncate">
                                                              {chat.title}
                                                            </p>
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>

                                                    {editingChatId !== chat.id && (
                                                      <div className="flex items-center">
                                                        <DropdownMenu>
                                                          <DropdownMenuTrigger asChild>
                                                            <Button
                                                              variant="ghost"
                                                              size="icon"
                                                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                              onClick={(e) => e.stopPropagation()}
                                                            >
                                                              <MoreVertical className="h-3.5 w-3.5" />
                                                            </Button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleGenerateTitle(chat.id);
                                                              }}
                                                            >
                                                              <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-2" />
                                                              {chat.title === "New Chat" ? "Generate title" : "Regenerate title"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingChatId(chat.id);
                                                                setEditTitle(chat.title);
                                                              }}
                                                            >
                                                              <Edit2 className="h-3.5 w-3.5 mr-2" />
                                                              Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                              className="text-destructive focus:text-destructive"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                setChatToDelete(chat.id);
                                                                setIsDeleteDialogOpen(true);
                                                              }}
                                                            >
                                                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                              Delete
                                                            </DropdownMenuItem>
                                                          </DropdownMenuContent>
                                                        </DropdownMenu>
                                                      </div>
                                                    )}

                                                    <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">
                                                      {formatDate(chat.updatedAt)}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {/* Render standalone chats */}
                                      {standaloneChats.map((chat) => (
                                        <div
                                          key={chat.id}
                                          className={`group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50 ${
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
                                                <div className="flex items-center">
                                                  <p className="font-medium text-sm truncate">
                                                    {chat.title}
                                                  </p>
                                                </div>
                                              </>
                                            )}
                                          </div>

                                          {editingChatId !== chat.id && (
                                            <div className="flex items-center">
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                  <DropdownMenuItem
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleGenerateTitle(chat.id);
                                                    }}
                                                  >
                                                    <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-2" />
                                                    {chat.title === "New Chat" ? "Generate title" : "Regenerate title"}
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingChatId(chat.id);
                                                      setEditTitle(chat.title);
                                                    }}
                                                  >
                                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                                    Rename
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setChatToDelete(chat.id);
                                                      setIsDeleteDialogOpen(true);
                                                    }}
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                    Delete
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          )}

                                          <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">
                                            {formatDate(chat.updatedAt)}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
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

              {/* Settings and action buttons in the bottom corner */}
              <div className="p-2 border-t border-border/40 absolute bottom-4 right-4 flex gap-1">
                {/* Update all titles button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={handleUpdateAllTitles}
                        disabled={isUpdatingAllTitles}
                      >
                        {isUpdatingAllTitles ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {isUpdatingAllTitles ? "Updating titles..." : "Update all 'New Chat' titles"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={() => router.push('/settings')}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Settings</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Log out</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
    </>
  );
}
