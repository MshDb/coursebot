"use client";

import { useState } from "react";
import { api } from "@/trpc/client";
import { Bot as BotIcon, Plus, MoreHorizontal, Trash2, Settings, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AddBotDialog } from "./add-bot-dialog";

interface BotListProps {
  workspaceId: string;
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PAUSED: "secondary",
  ERROR: "destructive",
  DELETED: "outline",
};

export function BotList({ workspaceId, showAddDialog, setShowAddDialog }: BotListProps) {
  const router = useRouter();
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);

  const { data: bots, isLoading, refetch } = api.bot.list.useQuery({ workspaceId });

  const deleteMutation = api.bot.delete.useMutation({
    onSuccess: () => {
      toast.success("Bot deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete bot");
    },
  });

  const handleDelete = () => {
    if (deletingBotId) {
      deleteMutation.mutate({ workspaceId, botId: deletingBotId });
      setDeletingBotId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!bots || bots.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center bg-card">
          <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No bots connected</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            Connect your first Telegram bot to start distributing courses and sending messages to your subscribers.
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Bot
          </Button>
        </div>
        <AddBotDialog
          workspaceId={workspaceId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => refetch()}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => router.push(`/workspace/${workspaceId}/bots/${bot.id}`)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BotIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bot.displayName}</span>
                  <Badge variant={statusVariant[bot.status] ?? "outline"}>
                    {bot.status === "ERROR" && <AlertTriangle className="mr-1 h-3 w-3" />}
                    {bot.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">@{bot.telegramBotUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{(bot as unknown as { _count: { subscribers: number } })._count.subscribers}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/workspace/${workspaceId}/bots/${bot.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeletingBotId(bot.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingBotId} onOpenChange={(open) => !open && setDeletingBotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bot</AlertDialogTitle>
            <AlertDialogDescription>
              This will unregister the webhook and remove the bot from your workspace.
              Subscribers will no longer receive messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Bot"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddBotDialog
        workspaceId={workspaceId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => refetch()}
      />
    </>
  );
}
