/**
 * Telegram Bot API wrapper.
 * Lightweight, type-safe, framework-independent. Uses native fetch.
 * Only wraps the methods needed for this spec.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TelegramBot {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramApiError {
  ok: false;
  error_code: number;
  description: string;
}

export interface TelegramApiResponse<T> {
  ok: true;
  result: T;
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface SendMessageOptions {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: unknown;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function callTelegramApi<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });

      // If rate limited (429) or server error (5xx), retry with backoff
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const data = (await response.json()) as TelegramApiResponse<T> | TelegramApiError;

      if (!data.ok) {
        const apiError = data as TelegramApiError;
        throw new Error(`Telegram API error [${apiError.error_code}]: ${apiError.description}`);
      }

      return (data as TelegramApiResponse<T>).result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES && !lastError.message.includes("Telegram API error")) {
        // Network errors: retry
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("Telegram API call failed after retries");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a bot token by calling Telegram's getMe endpoint.
 * @returns Bot information from Telegram
 * @throws Error if the token is invalid
 */
export async function validateToken(token: string): Promise<TelegramBot> {
  return callTelegramApi<TelegramBot>(token, "getMe");
}

/**
 * Registers a webhook URL with Telegram for the bot.
 * @param token - Bot API token
 * @param url - Webhook URL to register
 * @param secretToken - Secret token for X-Telegram-Bot-Api-Secret-Token header verification
 */
export async function setWebhook(
  token: string,
  url: string,
  secretToken: string,
): Promise<void> {
  await callTelegramApi<boolean>(token, "setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });
}

/**
 * Removes the webhook for the bot.
 */
export async function deleteWebhook(token: string): Promise<void> {
  await callTelegramApi<boolean>(token, "deleteWebhook");
}

/**
 * Sends a text message to a Telegram chat.
 */
export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  options?: SendMessageOptions,
): Promise<void> {
  await callTelegramApi(token, "sendMessage", {
    chat_id: chatId,
    text,
    ...options,
  });
}

/**
 * Answers a callback query (inline keyboard button press).
 */
export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await callTelegramApi(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

/**
 * Sets the list of the bot's commands (shown in the menu).
 */
export async function setMyCommands(
  token: string,
  commands: BotCommand[],
): Promise<void> {
  await callTelegramApi(token, "setMyCommands", { commands });
}

/**
 * Gets the list of the bot's current commands.
 */
export async function getMyCommands(token: string): Promise<BotCommand[]> {
  return callTelegramApi<BotCommand[]>(token, "getMyCommands");
}
