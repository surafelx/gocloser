# Deployment Guide for GoCloser Sales AI

This guide provides instructions for deploying the GoCloser Sales AI application to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:

1. A valid Google Gemini API key set in your environment variables
2. Completed a successful production build with `npm run build`
3. A domain name registered and ready to use

## Environment Variables

Make sure the following environment variables are set in your production environment:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest platform for deploying Next.js applications.

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the application:
   ```
   vercel
   ```

4. To deploy to production:
   ```
   vercel --prod
   ```

5. Configure your custom domain in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Domains" section
   - Add your domain and follow the DNS configuration instructions

### Option 2: Netlify

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Initialize your site:
   ```
   netlify init
   ```

4. Deploy to production:
   ```
   netlify deploy --prod
   ```

5. Configure your custom domain in the Netlify dashboard:
   - Go to your site settings
   - Navigate to the "Domain management" section
   - Add your custom domain and follow the DNS configuration instructions

### Option 3: AWS Amplify

1. Install the AWS Amplify CLI:
   ```
   npm install -g @aws-amplify/cli
   ```

2. Configure Amplify:
   ```
   amplify configure
   ```

3. Initialize Amplify in your project:
   ```
   amplify init
   ```

4. Add hosting:
   ```
   amplify add hosting
   ```

5. Deploy:
   ```
   amplify publish
   ```

6. Configure your custom domain in the AWS Amplify Console:
   - Go to your app in the Amplify Console
   - Navigate to "Domain Management"
   - Add your domain and follow the DNS configuration instructions

### Option 4: Traditional VPS/Server Deployment

If you're deploying to a traditional server or VPS:

1. Build your application:
   ```
   npm run build
   ```

2. Install PM2 for process management:
   ```
   npm install -g pm2
   ```

3. Start your application:
   ```
   pm2 start npm --name "gocloser" -- start
   ```

4. Configure Nginx as a reverse proxy:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. Set up SSL with Let's Encrypt:
   ```
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Post-Deployment Steps

After deploying to your domain:

1. Verify that the Gemini API integration is working correctly
2. Test the application on various devices and browsers
3. Set up monitoring and analytics
4. Configure backup solutions

## Troubleshooting

If you encounter issues with the Gemini API in production:

1. Verify that your API key is correctly set in the environment variables
2. Check that your API key has the necessary permissions
3. Ensure your deployment platform allows outbound connections to the Gemini API endpoints
4. Check the server logs for any specific error messages

For any other deployment issues, refer to the documentation of your chosen hosting platform.
