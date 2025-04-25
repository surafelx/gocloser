import { NextRequest, NextResponse } from 'next/server';

// This catch-all route handler will handle OPTIONS requests for all API routes
export function OPTIONS(request: NextRequest) {
  // Return response with CORS headers
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// For any other method that falls through to this catch-all route
export function GET(request: NextRequest) {
  return NextResponse.json({ message: 'API is working' }, { status: 200 });
}

export function POST(request: NextRequest) {
  return NextResponse.json({ message: 'API is working' }, { status: 200 });
}
