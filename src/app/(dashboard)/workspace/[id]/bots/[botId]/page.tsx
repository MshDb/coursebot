import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { BotService } from "@/modules/bot/service";
import BotDetailClient from "./_components/bot-detail-client";

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ id: string; botId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(ROUTES.LOGIN);
  }

  const { id: workspaceId, botId } = await params;

  let bot;
  try {
    bot = await BotService.getById(db, workspaceId, botId);
  } catch {
    redirect(ROUTES.WORKSPACE_BOTS(workspaceId));
  }

  // Serialize BigInt fields for client component
  const serializedBot = {
    ...bot,
    telegramBotId: bot.telegramBotId.toString(),
    _count: (bot as unknown as { _count: { subscribers: number } })._count,
  };

  return (
    <BotDetailClient
      workspaceId={workspaceId}
      bot={serializedBot}
    />
  );
}
