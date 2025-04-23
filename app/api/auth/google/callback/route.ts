import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth callback handler
 * This endpoint handles the redirect from Google OAuth
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL and extract the token from the hash fragment
    const url = new URL(request.url);
    const token = url.hash ? url.hash.substring(1).split('&').find(param => param.startsWith('access_token='))?.split('=')[1] : null;

    if (!token) {
      // If no token is found, redirect to the login page with an error
      return NextResponse.redirect(new URL('/login?error=Google+authentication+failed', request.url));
    }

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=Failed+to+fetch+user+info', request.url));
    }

    const userInfo = await userInfoResponse.json();

    // Prepare the data for our backend
    const googleData = {
      googleId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      profilePicture: userInfo.picture,
      token
    };

    // Call our backend API to authenticate the user
    const authResponse = await fetch(new URL('/api/auth/google', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleData)
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorData.error || 'Google authentication failed')}`, request.url));
    }

    // Redirect to the chat page on success
    return NextResponse.redirect(new URL('/chat', request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/login?error=An+unexpected+error+occurred', request.url));
  }
}
