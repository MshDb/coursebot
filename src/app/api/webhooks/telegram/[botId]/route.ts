import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { sendMessage, answerCallbackQuery } from "@/lib/telegram";
import { EndUserService } from "@/modules/end-user/service";
import { SubscriberStatus, BotStatus } from "@prisma/client";
import {
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_FALLBACK_MESSAGE,
} from "@/modules/bot/constants";

// ---------------------------------------------------------------------------
// Types for Telegram Update objects
// ---------------------------------------------------------------------------

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  entities?: Array<{ type: string; offset: number; length: number }>;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ---------------------------------------------------------------------------
// POST handler — Telegram webhook endpoint
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  const { botId } = await params;

  try {
    // 1. Look up the bot
    const bot = await db.bot.findUnique({
      where: { id: botId },
    });

    if (!bot || bot.deletedAt !== null || bot.status === BotStatus.DELETED) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    // 2. Verify webhook secret token (T017)
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretHeader !== bot.webhookSecretToken) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    // 3. Parse the update
    const update = (await req.json()) as TelegramUpdate;

    // 4. Decrypt the bot token for API calls
    const token = decrypt(bot.tokenEncrypted);

    // 5. Route the update
    if (update.message) {
      await handleMessage(bot, token, update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(token, update.callback_query);
    }

    // Always return 200 to Telegram (even on errors, to prevent retries)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[Webhook ${botId}] Error:`, error);
    // Return 200 even on error — Telegram will retry on non-200, causing loops
    return NextResponse.json({ ok: true });
  }
}

// ---------------------------------------------------------------------------
// T018: /start command handler
// ---------------------------------------------------------------------------

async function handleMessage(
  bot: { id: string; welcomeMessage: string | null },
  token: string,
  message: TelegramMessage,
) {
  const text = message.text ?? "";
  const isCommand =
    message.entities?.some((e) => e.type === "bot_command" && e.offset === 0) ?? false;

  if (isCommand && text.startsWith("/start")) {
    await handleStartCommand(bot, token, message);
  } else {
    // T019: Unknown message fallback
    await sendMessage(token, message.chat.id, DEFAULT_FALLBACK_MESSAGE);
  }
}

async function handleStartCommand(
  bot: { id: string; welcomeMessage: string | null },
  token: string,
  message: TelegramMessage,
) {
  const telegramUser = message.from;

  // 1. FindOrCreate EndUser (global dedup by telegram_user_id)
  const endUser = await EndUserService.findOrCreate(db, BigInt(telegramUser.id), {
    firstName: telegramUser.first_name ?? null,
    lastName: telegramUser.last_name ?? null,
    username: telegramUser.username ?? null,
    languageCode: telegramUser.language_code ?? null,
  });

  // 2. Create BotSubscriber (upsert to handle duplicate /start)
  await db.botSubscriber.upsert({
    where: {
      botId_endUserId: {
        botId: bot.id,
        endUserId: endUser.id,
      },
    },
    create: {
      botId: bot.id,
      endUserId: endUser.id,
      status: SubscriberStatus.ACTIVE,
    },
    update: {
      // Duplicate /start: update status back to ACTIVE if previously blocked/unsubscribed
      status: SubscriberStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  // 3. Send welcome message
  const welcomeText = bot.welcomeMessage || DEFAULT_WELCOME_MESSAGE;
  await sendMessage(token, message.chat.id, welcomeText);
}

// ---------------------------------------------------------------------------
// T032: Callback query handler
// ---------------------------------------------------------------------------

async function handleCallbackQuery(
  token: string,
  callbackQuery: TelegramCallbackQuery,
) {
  // Answer the callback query to remove the loading indicator
  await answerCallbackQuery(token, callbackQuery.id);

  // If callback data is present, we can handle specific actions here.
  // For now, just acknowledge — future specs will add course browsing etc.
}
