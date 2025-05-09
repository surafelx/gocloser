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
  const isBillingPage = pathname === "/billing"

  // Public pages that don't require authentication
  const isPublicPage = pathname === "/"

  // 🔒 Redirect unauthenticated users trying to access protected routes
  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    console.log('Redirecting unauthenticated request to login:', pathname)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🔁 Optional redirect from /dashboard to /chat
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  // 🚫 Redirect authenticated users away from login/signup
  if (isAuthenticated && isAuthPage) {
    // Check if the user has a subscription cookie
    const hasSubscription = request.cookies.has('has_subscription')
    const isAdmin = request.cookies.has('is_admin')

    // If user is admin or has subscription, redirect to chat
    if (isAdmin || hasSubscription) {
      return NextResponse.redirect(new URL("/chat", request.url))
    }

    // Otherwise redirect to billing
    return NextResponse.redirect(new URL("/billing", request.url))
  }

  // 💰 Protect chat and other app routes for users without subscription
  if (isAuthenticated && !isBillingPage && !isPublicPage) {
    // Check if the user has a subscription cookie or is admin
    const hasSubscription = request.cookies.has('has_subscription')
    const isAdmin = request.cookies.has('is_admin')

    // If user doesn't have subscription and isn't admin, redirect to billing
    if (!hasSubscription && !isAdmin) {
      console.log('Redirecting user without subscription to billing:', pathname)
      return NextResponse.redirect(new URL("/billing", request.url))
    }
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
