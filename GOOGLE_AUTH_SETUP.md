# Setting Up Google Authentication

This guide will help you set up Google OAuth authentication for the GoCloser application.

## Prerequisites

1. A Google account
2. Access to the [Google Cloud Console](https://console.cloud.google.com/)

## Steps to Create a Google OAuth Client ID

1. **Create a new project in Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the project dropdown at the top of the page
   - Click "New Project"
   - Enter a name for your project (e.g., "GoCloser")
   - Click "Create"

2. **Enable the Google OAuth API**
   - In your new project, go to "APIs & Services" > "Library"
   - Search for "Google Identity Services" or "OAuth"
   - Click on "Google Identity Services" and enable it

3. **Configure the OAuth consent screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type (unless you're using a Google Workspace account)
   - Click "Create"
   - Fill in the required information:
     - App name: "GoCloser"
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Add the following scopes:
     - `./auth/userinfo.email`
     - `./auth/userinfo.profile`
   - Click "Save and Continue"
   - Add test users if you're in testing mode
   - Click "Save and Continue"

4. **Create OAuth Client ID**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "GoCloser Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://gocloser.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://gocloser.com`)
   - Click "Create"

5. **Get your Client ID**
   - After creating the OAuth client ID, you'll see a modal with your Client ID and Client Secret
   - Copy the Client ID (you don't need the Client Secret for this implementation)

## Configure the Application

1. **Create or update your `.env.local` file**
   - Copy the `.env.local.example` file to `.env.local` if you haven't already
   - Add your Google Client ID to the `.env.local` file:
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     ```

2. **Restart the development server**
   - If your development server is running, restart it to apply the new environment variables

## Testing Google Authentication

1. Start the development server:
   ```
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000/login`

3. Click the "Continue with Google" button

4. You should see the Google authentication popup

5. After successful authentication, you should be redirected to the chat page

## Troubleshooting

If you encounter issues with Google authentication:

1. **Check the browser console for errors**
   - Open your browser's developer tools (F12 or right-click > Inspect)
   - Look for any errors in the Console tab

2. **Verify your Client ID**
   - Make sure the Client ID in your `.env.local` file matches the one in Google Cloud Console
   - Ensure there are no extra spaces or characters

3. **Check authorized domains**
   - Make sure your development and production domains are properly configured in the Google Cloud Console

4. **Clear browser cookies and cache**
   - Sometimes, old authentication tokens can cause issues

5. **Check for CORS issues**
   - If you see CORS errors, make sure your domains are properly configured in the Google Cloud Console

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web/sign-in)
