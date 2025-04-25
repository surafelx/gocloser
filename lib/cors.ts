import { NextRequest, NextResponse } from 'next/server';

// CORS middleware for API routes
export function corsMiddleware(request: NextRequest, handler: (request: NextRequest) => Promise<NextResponse>) {
  // Check if it's a preflight request (OPTIONS)
  if (request.method === 'OPTIONS') {
    // Return response with CORS headers
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // For actual requests, add CORS headers to the response
  return handler(request).then((response) => {
    // Add CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  });
}
