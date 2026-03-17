"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotList } from "@/components/bots/bot-list";

interface BotListPageClientProps {
  workspaceId: string;
}

export default function BotListPageClient({ workspaceId }: BotListPageClientProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bots</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your connected Telegram bots.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Bot
        </Button>
      </div>
      <BotList workspaceId={workspaceId} />
    </div>
  );
}
