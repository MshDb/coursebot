"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Bot, BookOpen, Send, Users, BarChart3, Settings, Loader2 } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { api } from "@/trpc/client";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function Sidebar({ className }: { className?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params?.id as string | undefined;

  const { data: workspace, isLoading } = api.workspace.getById.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId }
  );

  const navItems = workspaceId
    ? [
        { href: ROUTES.WORKSPACE(workspaceId), label: "Overview", icon: BarChart3 },
        { href: ROUTES.WORKSPACE_BOTS(workspaceId), label: "Bots", icon: Bot },
        { href: ROUTES.WORKSPACE_COURSES(workspaceId), label: "Courses", icon: BookOpen },
        { href: ROUTES.WORKSPACE_POSTS(workspaceId), label: "Posts", icon: Send },
        { href: ROUTES.WORKSPACE_SUBSCRIBERS(workspaceId), label: "Subscribers", icon: Users },
        { href: ROUTES.WORKSPACE_SETTINGS(workspaceId), label: "Settings", icon: Settings },
      ]
    : [];

  return (
    <div className={`flex flex-col h-full border-r bg-card ${className || ""}`}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 justify-between shrink-0">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 font-semibold truncate hover:text-primary transition-colors pr-2">
          <Bot className="h-6 w-6 shrink-0" />
          <span className="text-xl truncate">
            {workspace ? workspace.name : "CourseBot"}
          </span>
        </Link>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="p-4 shrink-0">
        <WorkspaceSwitcher />
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== ROUTES.WORKSPACE(workspaceId!) && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted ${
                  isActive ? "bg-muted text-primary font-medium" : "text-muted-foreground"
                }`}
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
