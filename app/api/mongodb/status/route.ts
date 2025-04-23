import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';

export async function GET() {
  try {
    console.log('Checking MongoDB connection...');
    const mongoose = await dbConnect();
    
    // Check if the connection is ready
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({
        connected: true,
        message: 'Successfully connected to MongoDB',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      });
    } else {
      return NextResponse.json({
        connected: false,
        error: 'MongoDB connection not ready',
        readyState: mongoose.connection.readyState
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({
      connected: false,
      error: error.message || 'Failed to connect to MongoDB'
    }, { status: 500 });
  }
}
