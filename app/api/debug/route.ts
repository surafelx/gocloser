import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function GET(request: NextRequest) {
  try {
    // Check environment variables (without revealing full secrets)
    const envCheck = {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "missing",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 
        `${process.env.CLOUDINARY_API_KEY.substring(0, 4)}...${process.env.CLOUDINARY_API_KEY.substring(process.env.CLOUDINARY_API_KEY.length - 4)}` : 
        "missing",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 
        `${process.env.CLOUDINARY_API_SECRET.substring(0, 4)}...${process.env.CLOUDINARY_API_SECRET.substring(process.env.CLOUDINARY_API_SECRET.length - 4)}` : 
        "missing",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 
        `${process.env.OPENAI_API_KEY.substring(0, 4)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : 
        "missing",
      NODE_ENV: process.env.NODE_ENV || "unknown",
      VERCEL_ENV: process.env.VERCEL_ENV || "not on vercel",
      VERCEL_REGION: process.env.VERCEL_REGION || "unknown",
    };

    // Test Cloudinary connectivity
    let cloudinaryStatus = "Not tested";
    try {
      // Configure Cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      
      // Test Cloudinary API with a simple ping
      const result = await cloudinary.api.ping();
      cloudinaryStatus = result.status === "ok" ? "Connected" : "Error: " + JSON.stringify(result);
    } catch (error: any) {
      cloudinaryStatus = `Error: ${error.message || "Unknown error"}`;
    }

    // Return diagnostic information
    return NextResponse.json({
      environment: envCheck,
      cloudinary: cloudinaryStatus,
      timestamp: new Date().toISOString(),
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Diagnostic failed",
      message: error.message || "Unknown error",
    }, { status: 500 });
  }
}
