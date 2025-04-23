import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ChatProvider } from "@/contexts/chat-context";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GoCloser - AI Sales Training Platform",
  description:
    "Improve your sales performance with AI-powered analysis and feedback",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <ChatProvider initialMessages={[
              {
                id: "welcome",
                role: "assistant",
                content: "Hi there! I'm your AI sales coach. You can chat with me about sales techniques, upload sales calls for analysis, or practice your pitch. How can I help you today?",
              },
            ]}>
              {children}
              <Toaster />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
