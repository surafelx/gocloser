/**
 * Google Authentication Utilities
 *
 * This file contains utilities for handling Google OAuth authentication
 * with proper CORS and cookie handling for Chrome compatibility.
 */

// Function to initialize Google OAuth
export function initGoogleAuth(clientId: string) {
  // Load the Google API script dynamically
  if (typeof window !== 'undefined' && !window.google) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return new Promise<void>((resolve) => {
      script.onload = () => {
        resolve();
      };
    });
  }

  return Promise.resolve();
}

// Function to handle Google OAuth login
export async function handleGoogleLogin(
  clientId: string,
  onSuccess: (response: any) => void,
  onError: (error: Error) => void
) {
  try {
    // Initialize Google Auth
    await initGoogleAuth(clientId);

    // Configure Google OAuth
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response.credential) {
          onSuccess(response);
        } else {
          onError(new Error('Google authentication failed'));
        }
      },
      context: 'signin',
      ux_mode: 'popup', // Changed back to popup mode for better compatibility
      cancel_on_tap_outside: true,
      // Use SameSite=None and Secure for cross-origin requests
      use_fedcm_for_prompt: false // Disabled FedCM API as it might be causing issues
    });

    console.log('Google OAuth initialized with client ID:', clientId);

    // Prompt the user to select an account
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.warn('Google sign-in prompt not displayed or skipped:', notification.getNotDisplayedReason() || notification.getSkippedReason());

        // As a fallback, try to open the Google sign-in page directly
        // Use a client-side callback page to handle the OAuth response
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&scope=email%20profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
        console.log('Opening Google auth URL with redirect URI:', redirectUri);
        window.open(authUrl, '_blank', 'width=500,height=600');
      }
    });
  } catch (error) {
    onError(error as Error);
  }
}

// Function to handle the Google OAuth response
export async function processGoogleAuthResponse(response: any) {
  try {
    // Extract the JWT token from the response
    const { credential } = response;

    // Decode the JWT token to get user information
    const payload = decodeJwtResponse(credential);

    // Return the user information
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      profilePicture: payload.picture,
      token: credential
    };
  } catch (error) {
    console.error('Error processing Google auth response:', error);
    throw new Error('Failed to process Google authentication response');
  }
}

// Function to decode the JWT token
function decodeJwtResponse(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

  return JSON.parse(jsonPayload);
}

// Add type definitions for the Google API
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, options: any) => void;
        };
      };
    };
  }
}
