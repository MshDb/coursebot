import Link from "next/link";
import { Bot, BookOpen, Send, Users, BarChart3, Settings } from "lucide-react";

import { ROUTES } from "@/lib/constants";

// Represents static workspace routes for MVP
const navItems = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/bots", label: "Bots", icon: Bot },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/posts", label: "Posts", icon: Send },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col h-full border-r bg-card ${className}`}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6" />
          <span className="text-xl">CourseBot</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
