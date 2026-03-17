"use client";

import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function BotLinkManager({ workspaceId, courseId }: { workspaceId: string; courseId: string; }) {
  const ctx = api.useUtils();
  const [selectedBot, setSelectedBot] = useState("");

  const { data: course, isLoading: isCourseLoading } = api.course.getById.useQuery({ workspaceId, id: courseId });
  const { data: bots, isLoading: isBotsLoading } = api.bot.list.useQuery({ workspaceId });

  const link = api.course.linkToBot.useMutation({
    onSuccess: () => {
      toast.success("Bot linked");
      setSelectedBot("");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const unlink = api.course.unlinkFromBot.useMutation({
    onSuccess: () => {
      toast.success("Bot unlinked");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  if (isCourseLoading || isBotsLoading) return <Skeleton className="h-32 w-full" />;

  const linkedBotIds = new Set(course?.botLinks.map(bl => bl.botId));
  const availableBots = (bots || []).filter(b => !linkedBotIds.has(b.id));

  return (
    <div className="space-y-4">
      {course?.botLinks && course.botLinks.length > 0 ? (
        <ul className="space-y-2">
          {course.botLinks.map(({ bot }) => (
            <li key={bot.id} className="flex flex-wrap items-center justify-between p-3 rounded-md border bg-muted/50">
              <span className="font-medium">@{bot.telegramBotUsername} <span className="text-muted-foreground text-sm font-normal">({bot.displayName})</span></span>
              <Button variant="ghost" size="sm" onClick={() => unlink.mutate({ workspaceId, courseId, botId: bot.id })} disabled={unlink.isPending}>
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No bots linked.</p>
      )}

      {availableBots.length > 0 && (
        <div className="flex gap-2 items-center pt-2">
          <Select value={selectedBot} onValueChange={v => setSelectedBot(v || "")}>
            <SelectTrigger className="flex-1 max-w-sm">
              <SelectValue placeholder="Select a bot to link" />
            </SelectTrigger>
            <SelectContent>
              {availableBots.map(bot => (
                <SelectItem key={bot.id} value={bot.id}>
                  @{bot.telegramBotUsername} ({bot.displayName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selectedBot || link.isPending} onClick={() => link.mutate({ workspaceId, courseId, botId: selectedBot })}>
            Link Bot
          </Button>
        </div>
      )}
    </div>
  );
}
