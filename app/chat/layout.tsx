"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar-new";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full bg-background/80 backdrop-blur-sm"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChatSidebar />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
