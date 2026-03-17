import type { Bot, BotSubscriber } from "@prisma/client";

/**
 * Bot with subscriber count for list display.
 */
export interface BotWithSubscriberCount extends Bot {
  _count: {
    subscribers: number;
  };
}

/**
 * Telegram getMe response shape (subset relevant for bot creation).
 */
export interface TelegramBotInfo {
  id: number;
  first_name: string;
  username: string;
}
