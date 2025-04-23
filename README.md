# GoCloser Sales AI

GoCloser is an AI-powered sales coaching platform that helps sales professionals improve their techniques through AI feedback and analysis.

## Features

- AI Sales Coach: Chat with our AI coach to practice sales scenarios and get real-time feedback
- Media Analysis: Upload audio, video, or text files for comprehensive AI analysis
- Performance Insights: Receive detailed performance scores and actionable feedback
- Progress Tracking: Monitor your improvement over time with detailed analytics

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Google Gemini AI

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or pnpm
- Google Gemini API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gocloser.git
   cd gocloser
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

### Vercel (Recommended)

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```
   npm run deploy:vercel
   ```

3. Configure your custom domain in the Vercel dashboard.

### Netlify

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Deploy to Netlify:
   ```
   npm run deploy:netlify
   ```

3. Configure your custom domain in the Netlify dashboard.

### Traditional Server/VPS

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm run start:prod
   ```

3. For a complete server setup with Nginx, use the provided deployment script:
   ```
   chmod +x deploy.sh
   ./deploy.sh
   ```

For detailed deployment instructions, see [deployment.md](deployment.md).

## Environment Variables

- `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for powering the AI features
- Vercel for Next.js hosting
- Tailwind CSS for styling
