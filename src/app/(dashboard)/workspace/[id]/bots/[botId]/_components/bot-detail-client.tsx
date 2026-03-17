"use client";

import { useRouter } from "next/navigation";
import { Bot as BotIcon, ArrowLeft, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotConfigForm } from "@/components/bots/bot-config-form";

interface BotDetailClientProps {
  workspaceId: string;
  bot: {
    id: string;
    displayName: string;
    telegramBotUsername: string;
    telegramBotId: string;
    status: string;
    welcomeMessage: string | null;
    menuConfig: unknown;
    webhookUrl: string | null;
    _count: { subscribers: number };
  };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PAUSED: "secondary",
  ERROR: "destructive",
  DELETED: "outline",
};

export default function BotDetailClient({ workspaceId, bot }: BotDetailClientProps) {
  const router = useRouter();

  const menuConfig = bot.menuConfig as Array<{ command: string; description: string }> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/workspace/${workspaceId}/bots`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BotIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{bot.displayName}</h1>
              <Badge variant={statusVariant[bot.status] ?? "outline"}>
                {bot.status === "ERROR" && <AlertTriangle className="mr-1 h-3 w-3" />}
                {bot.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{bot.telegramBotUsername}</p>
          </div>
        </div>
      </div>

      {/* T022: ERROR status warning banner */}
      {bot.status === "ERROR" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {bot.webhookUrl?.startsWith("http://localhost") 
              ? "Webhook registration failed (Local Dev)" 
              : "Bot Token Error"}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {bot.webhookUrl?.startsWith("http://localhost") 
                ? "Telegram requires an HTTPS URL for webhooks. On localhost, the bot is connected but won't receive messages until you use a tunnel like ngrok or deploy to HTTPS."
                : "The bot token appears to be revoked or invalid. The bot cannot receive or send messages. Please verify the token with @BotFather."}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Re-check
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* T024: Subscriber count card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bot._count.subscribers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users who sent /start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telegram ID</CardTitle>
            <BotIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{bot.telegramBotId}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono text-muted-foreground truncate">
              {bot.webhookUrl ?? "Not registered"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot configuration form */}
      <BotConfigForm
        workspaceId={workspaceId}
        botId={bot.id}
        initialWelcomeMessage={bot.welcomeMessage}
        initialMenuConfig={menuConfig}
      />
    </div>
  );
}
