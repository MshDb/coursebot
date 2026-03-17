"use client";

import { useState } from "react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface BotConfigFormProps {
  workspaceId: string;
  botId: string;
  initialWelcomeMessage: string | null;
  initialMenuConfig: Array<{ command: string; description: string }> | null;
}

export function BotConfigForm({
  workspaceId,
  botId,
  initialWelcomeMessage,
  initialMenuConfig,
}: BotConfigFormProps) {
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage ?? "");
  const [menuCommands, setMenuCommands] = useState<Array<{ command: string; description: string }>>(
    initialMenuConfig ?? [],
  );
  const [savingAction, setSavingAction] = useState<"welcome" | "menu" | null>(null);

  const updateMutation = api.bot.update.useMutation({
    onSuccess: () => {
      toast.success("Bot configuration saved");
      setSavingAction(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save configuration");
      setSavingAction(null);
    },
  });

  const handleSaveWelcome = () => {
    setSavingAction("welcome");
    updateMutation.mutate({
      workspaceId,
      botId,
      welcomeMessage: welcomeMessage || null,
    });
  };

  const handleSaveMenu = () => {
    const validCommands = menuCommands.filter(
      (cmd) => cmd.command.trim() && cmd.description.trim(),
    );
    setSavingAction("menu");
    updateMutation.mutate({
      workspaceId,
      botId,
      menuConfig: validCommands.length > 0 ? validCommands : null,
    });
  };

  const addCommand = () => {
    setMenuCommands([...menuCommands, { command: "", description: "" }]);
  };

  const removeCommand = (index: number) => {
    setMenuCommands(menuCommands.filter((_, i) => i !== index));
  };

  const updateCommand = (index: number, field: "command" | "description", value: string) => {
    const updated = [...menuCommands];
    updated[index] = { ...updated[index]!, [field]: value };
    setMenuCommands(updated);
  };

  return (
    <div className="space-y-6">
      {/* Welcome message card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
          <CardDescription>
            This message is sent when a new user sends /start to your bot. Support plain text only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Message</Label>
            <textarea
              id="welcome-message"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Welcome! 👋 Thanks for joining our community..."
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              maxLength={4096}
              disabled={updateMutation.isPending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {welcomeMessage.length} / 4096
            </p>
          </div>
          <Button onClick={handleSaveWelcome} disabled={savingAction !== null}>
            {savingAction === "welcome" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Welcome Message
          </Button>
        </CardContent>
      </Card>

      {/* Menu commands card */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Commands</CardTitle>
          <CardDescription>
            Configure bot menu commands shown to users in Telegram. These are registered via
            Telegram&apos;s setMyCommands API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {menuCommands.map((cmd, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="command_name"
                  value={cmd.command}
                  onChange={(e) => updateCommand(index, "command", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="flex-[2] space-y-1">
                <Input
                  placeholder="Description of the command"
                  value={cmd.description}
                  onChange={(e) => updateCommand(index, "description", e.target.value)}
                  disabled={savingAction !== null}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCommand(index)}
                disabled={savingAction !== null}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addCommand} disabled={savingAction !== null}>
            <Plus className="mr-2 h-4 w-4" />
            Add Command
          </Button>
          <div>
            <Button onClick={handleSaveMenu} disabled={savingAction !== null}>
              {savingAction === "menu" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Menu Commands
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
