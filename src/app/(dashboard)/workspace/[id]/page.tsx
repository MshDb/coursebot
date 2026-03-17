import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { WorkspaceService } from "@/modules/workspace/service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Users, Send } from "lucide-react";
import { ActivateTrialButton } from "./_components/activate-trial-button";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTES.LOGIN);
  }

  const { id } = await params;

  let workspace;
  try {
    workspace = await WorkspaceService.getById(db, id, session.user.id);
  } catch (err) {
    redirect(ROUTES.DASHBOARD);
  }

  // Fetch real metrics
  const bots = await db.bot.findMany({
    where: { 
      workspaceId: workspace.id,
      deletedAt: null
    },
    include: {
      _count: {
        select: { subscribers: true }
      }
    }
  });

  const botCount = bots.length;
  const subscriberCount = bots.reduce((acc, bot) => acc + bot._count.subscribers, 0);
  const messagesSentCount = await db.post.count({
    where: {
      bot: { workspaceId: workspace.id },
      // for now simplistic count of all posts
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Here is a summary of activity for {workspace.name}.
        </p>
      </div>

      {!workspace.subscription && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Activate Your Workspace</CardTitle>
            <CardDescription>
              Start your free 30-day trial to start creating bots and courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ActivateTrialButton workspaceId={workspace.id} />
          </CardContent>
        </Card>
      )}

      {/* Migration from dashboard/page.tsx */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder metric cards aligned to UI visual direction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {botCount === 0 ? "Connect a bot to start" : `${botCount} active bot${botCount === 1 ? "" : "s"}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all bots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesSentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {botCount === 0 && (
        <div className="mt-8">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center bg-card">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No bots connected</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              Connect your first Telegram bot to start distributing courses and sending messages.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
