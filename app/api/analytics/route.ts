import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Chat from "@/models/Chat";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

// Get analytics data for the current user
export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to the database
    await dbConnect();

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(currentUser.userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Get time range from query params
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "30days";
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "30days":
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // Find all chats for the user within the time range
    const chats = await Chat.find({
      userId: new mongoose.Types.ObjectId(currentUser.userId),
      updatedAt: { $gte: startDate }
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Calculate analytics data
    const totalChats = chats.length;
    
    // Count chats with attachments (audio, video, file)
    const chatsWithAttachments = chats.filter(chat => 
      chat.messages.some((msg: any) => msg.attachmentType)
    ).length;
    
    // Count total messages
    let totalMessages = 0;
    let userMessages = 0;
    let aiMessages = 0;
    let messagesByType = {
      text: 0,
      audio: 0,
      video: 0,
      file: 0
    };

    // Process messages for analytics
    chats.forEach(chat => {
      chat.messages.forEach((msg: any) => {
        totalMessages++;
        
        if (msg.role === 'user') {
          userMessages++;
          
          // Count message types
          if (msg.attachmentType === 'audio') {
            messagesByType.audio++;
          } else if (msg.attachmentType === 'video') {
            messagesByType.video++;
          } else if (msg.attachmentType === 'file') {
            messagesByType.file++;
          } else {
            messagesByType.text++;
          }
        } else {
          aiMessages++;
        }
      });
    });

    // Calculate percentages for message types
    const totalUserMessages = userMessages;
    const messageTypePercentages = {
      text: totalUserMessages > 0 ? Math.round((messagesByType.text / totalUserMessages) * 100) : 0,
      audio: totalUserMessages > 0 ? Math.round((messagesByType.audio / totalUserMessages) * 100) : 0,
      video: totalUserMessages > 0 ? Math.round((messagesByType.video / totalUserMessages) * 100) : 0,
      file: totalUserMessages > 0 ? Math.round((messagesByType.file / totalUserMessages) * 100) : 0
    };

    // Extract common topics from messages (simplified approach)
    const topics: Record<string, number> = {};
    const topicKeywords = {
      "Sales Techniques": ["technique", "approach", "strategy", "method", "sales"],
      "Objection Handling": ["objection", "concern", "hesitation", "doubt", "obstacle"],
      "Product Knowledge": ["product", "feature", "specification", "detail", "functionality"],
      "Closing Techniques": ["close", "closing", "deal", "agreement", "commitment"],
      "Negotiation": ["negotiate", "negotiation", "bargain", "compromise", "terms"]
    };

    chats.forEach(chat => {
      chat.messages.forEach((msg: any) => {
        if (msg.role === 'user') {
          const content = msg.content.toLowerCase();
          
          // Check for topic keywords
          Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => content.includes(keyword))) {
              topics[topic] = (topics[topic] || 0) + 1;
            }
          });
        }
      });
    });

    // Sort topics by frequency
    const sortedTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({
        topic,
        percentage: totalUserMessages > 0 
          ? Math.round((count / totalUserMessages) * 100) 
          : 0
      }));

    // If we have fewer than 5 topics, add "Other"
    if (sortedTopics.length < 5) {
      const existingPercentage = sortedTopics.reduce((sum, item) => sum + item.percentage, 0);
      if (existingPercentage < 100) {
        sortedTopics.push({
          topic: "Other",
          percentage: 100 - existingPercentage
        });
      }
    }

    // Return analytics data
    return NextResponse.json({
      success: true,
      timeRange,
      analytics: {
        totalChats,
        chatsWithAttachments,
        totalMessages,
        userMessages,
        aiMessages,
        messageTypePercentages,
        topics: sortedTopics
      }
    });
  } catch (error: any) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching analytics" },
      { status: 500 }
    );
  }
}
