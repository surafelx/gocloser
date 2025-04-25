import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Chat from "@/models/Chat";
import Analysis from "@/models/Analysis";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

// Analyze chat content and generate insights
export async function POST(request: NextRequest) {
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

    // Parse request body
    const { chatId } = await request.json();

    // If chatId is provided, analyze a specific chat
    // Otherwise, analyze recent chats
    let chats = [];
    
    if (chatId) {
      // Validate chatId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return NextResponse.json(
          { error: "Invalid chat ID format" },
          { status: 400 }
        );
      }
      
      // Get the specific chat
      const chat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(chatId),
        userId: new mongoose.Types.ObjectId(currentUser.userId)
      }).lean();
      
      if (!chat) {
        return NextResponse.json(
          { error: "Chat not found" },
          { status: 404 }
        );
      }
      
      chats = [chat];
    } else {
      // Get recent chats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      chats = await Chat.find({
        userId: new mongoose.Types.ObjectId(currentUser.userId),
        updatedAt: { $gte: thirtyDaysAgo }
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();
    }

    if (chats.length === 0) {
      return NextResponse.json(
        { error: "No chats available for analysis" },
        { status: 400 }
      );
    }

    // Perform analysis on the chat(s)
    // This is a simplified version - in a real implementation, you would use
    // a more sophisticated analysis algorithm or AI service
    
    // Extract all user messages from the chats
    const userMessages = chats.flatMap(chat => 
      chat.messages.filter((msg: any) => msg.role === 'user')
    );
    
    // Determine chat type based on attachments
    let chatType = 'text';
    for (const msg of userMessages) {
      if (msg.attachmentType === 'audio') {
        chatType = 'audio';
        break;
      } else if (msg.attachmentType === 'video') {
        chatType = 'video';
        break;
      } else if (msg.attachmentType === 'file') {
        chatType = 'file';
        break;
      }
    }
    
    // Generate metrics scores (in a real implementation, these would be calculated
    // based on actual analysis of message content)
    const metrics = [
      { 
        name: 'Clarity', 
        score: Math.floor(Math.random() * 30) + 70, 
        description: 'How clearly you communicate your message' 
      },
      { 
        name: 'Engagement', 
        score: Math.floor(Math.random() * 30) + 70, 
        description: 'How well you engage with the prospect' 
      },
      { 
        name: 'Objection Handling', 
        score: Math.floor(Math.random() * 30) + 70, 
        description: 'How effectively you address concerns' 
      },
      { 
        name: 'Closing Technique', 
        score: Math.floor(Math.random() * 30) + 70, 
        description: 'How well you close the deal' 
      }
    ];
    
    // Calculate overall score (average of metrics)
    const overallScore = Math.round(
      metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length
    );
    
    // Generate strengths and improvements based on metrics
    const strengths = [];
    const improvements = [];
    
    // Add strengths for high scores
    metrics.forEach(metric => {
      if (metric.score >= 85) {
        switch (metric.name) {
          case 'Clarity':
            strengths.push('Clear and concise communication');
            break;
          case 'Engagement':
            strengths.push('Excellent rapport building');
            break;
          case 'Objection Handling':
            strengths.push('Effective at addressing concerns');
            break;
          case 'Closing Technique':
            strengths.push('Strong closing skills');
            break;
        }
      }
    });
    
    // Add improvements for lower scores
    metrics.forEach(metric => {
      if (metric.score < 75) {
        switch (metric.name) {
          case 'Clarity':
            improvements.push('Could improve clarity of communication');
            break;
          case 'Engagement':
            improvements.push('Need to ask more engaging questions');
            break;
          case 'Objection Handling':
            improvements.push('Could improve handling of objections');
            break;
          case 'Closing Technique':
            improvements.push('Need to work on closing techniques');
            break;
        }
      }
    });
    
    // Add some generic strengths and improvements if lists are too short
    if (strengths.length < 2) {
      strengths.push('Good listening skills');
      strengths.push('Personalized approach');
    }
    
    if (improvements.length < 2) {
      improvements.push('Could provide more specific examples');
      improvements.push('Consider using more social proof');
    }
    
    // Create a title for the analysis
    let title = '';
    if (chatId) {
      title = chats[0].title || 'Chat Analysis';
    } else {
      title = 'Recent Chats Analysis';
    }
    
    // Create analysis record in database
    const analysis = await Analysis.create({
      userId: new mongoose.Types.ObjectId(currentUser.userId),
      chatIds: chats.map(chat => chat._id),
      title,
      date: new Date(),
      overallScore,
      metrics,
      strengths,
      improvements,
      type: chatType,
      status: 'complete'
    });
    
    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis._id,
        title: analysis.title,
        date: analysis.date.toISOString().split('T')[0],
        overallScore: analysis.overallScore,
        metrics: analysis.metrics,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        type: analysis.type,
        status: analysis.status
      }
    });
  } catch (error: any) {
    console.error("Analyze chat error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while analyzing chat" },
      { status: 500 }
    );
  }
}

// Get all analyses for the current user
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

    // Find all analyses for the user
    const analyses = await Analysis.find({
      userId: new mongoose.Types.ObjectId(currentUser.userId)
    })
      .sort({ date: -1 })
      .lean();

    // Format the analyses for the response
    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis._id,
      title: analysis.title,
      date: analysis.date.toISOString().split('T')[0],
      overallScore: analysis.overallScore,
      metrics: analysis.metrics,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      type: analysis.type,
      status: analysis.status
    }));

    return NextResponse.json({
      success: true,
      analyses: formattedAnalyses
    });
  } catch (error: any) {
    console.error("Get analyses error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching analyses" },
      { status: 500 }
    );
  }
}
