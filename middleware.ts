import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if user is authenticated
  const isAuthenticated = request.cookies.has('auth_token')
  const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup"

  // If trying to access protected routes without authentication
  if (!isAuthenticated && !isAuthPage &&
      request.nextUrl.pathname !== "/" &&
      !request.nextUrl.pathname.startsWith("/_next") &&
      !request.nextUrl.pathname.includes(".") &&
      // Allow API requests in development mode
      !(process.env.NODE_ENV !== 'production' &&
        (request.nextUrl.pathname.startsWith('/api/') ||
         request.nextUrl.pathname.startsWith('/chat')))) {
    console.log('Redirecting unauthenticated request to login:', request.nextUrl.pathname);
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to chat page after login/signup
  if (request.nextUrl.pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  // If already authenticated and trying to access login/signup pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
