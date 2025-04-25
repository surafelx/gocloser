import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ✅ Skip middleware for API routes, static files, and assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // e.g. favicon.ico or other static files
  ) {
    return NextResponse.next()
  }

  const isAuthenticated = request.cookies.has('auth_token')
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  // 🔒 Redirect unauthenticated users trying to access protected routes
  if (!isAuthenticated && !isAuthPage && pathname !== "/") {
    console.log('Redirecting unauthenticated request to login:', pathname)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🔁 Optional redirect from /dashboard to /chat
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  // 🚫 Redirect authenticated users away from login/signup
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // ✅ Match everything except:
    // - /api
    // - _next/static
    // - _next/image
    // - favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
