import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isChatPage = pathname === "/chat" || pathname.startsWith("/chat/");
  const { user, logout } = useAuth();

  const navItems = [
    { icon: MessageSquare, label: "Chat", href: "/chat", primary: true },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 gradient-dark border-r-0"
              >
                <div className="flex items-center font-bold text-xl mb-8">
                  <span className="text-primary animate-pulse-glow">
                    GoCloser
                  </span>
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 ${
                        item.primary
                          ? "gradient-blue text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
                          : pathname === item.href
                            ? "bg-accent text-foreground hover:bg-accent/80 hover:scale-105"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/chat" className="flex items-center font-bold text-xl">
              <span className="text-primary animate-pulse-glow">GoCloser</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium rounded-full px-5 py-2.5 transition-all duration-300 ${
                  item.primary
                    ? "gradient-blue text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
                    : pathname === item.href
                      ? "bg-accent text-foreground hover:bg-accent/80 hover:scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/50 transition-all hover:border-primary">
                    <AvatarImage
                      src={user?.profilePicture}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name ? user.name.split(' ')[0][0].toUpperCase() + (user.name.split(' ')[1]?.[0]?.toUpperCase() || '') : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 mt-1 rounded-xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Guest'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-100"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        {isChatPage && <ChatSidebar />}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
