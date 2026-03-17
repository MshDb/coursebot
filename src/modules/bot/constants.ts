import { BotStatus } from "@prisma/client";

/**
 * Bot status values used in the application.
 */
export const BOT_STATUS = BotStatus;

/**
 * Webhook path pattern for Telegram webhook URLs.
 * Format: /api/webhooks/telegram/{botId}
 */
export const WEBHOOK_PATH_PATTERN = "/api/webhooks/telegram";

/**
 * Default welcome message when none is configured.
 */
export const DEFAULT_WELCOME_MESSAGE = "Welcome! 👋";

/**
 * Default fallback message for unknown commands/messages.
 */
export const DEFAULT_FALLBACK_MESSAGE =
  "Sorry, I don't understand that command. Please use the menu to navigate.";

/**
 * Maximum bot token length (Telegram tokens are typically ~46 chars).
 */
export const MAX_TOKEN_LENGTH = 100;

/**
 * Length of the webhook secret token (hex-encoded random bytes).
 */
export const WEBHOOK_SECRET_LENGTH = 64;
