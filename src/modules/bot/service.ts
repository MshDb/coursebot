import type { PrismaClient } from "@prisma/client";
import { BotStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  validateToken,
  setWebhook,
  deleteWebhook,
  setMyCommands,
} from "@/lib/telegram";
import type { AddBotInput, UpdateBotInput } from "./schema";
import type { BotWithSubscriberCount } from "./types";
import {
  WEBHOOK_PATH_PATTERN,
  WEBHOOK_SECRET_LENGTH,
  DEFAULT_WELCOME_MESSAGE,
} from "./constants";
import { env } from "@/env";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import type { BotCommand } from "@/lib/telegram";

/**
 * Bot service — pure business logic. All Prisma queries live here.
 * No HTTP/framework concerns. Service portability: does NOT import from next/, @auth/, etc.
 */
export const BotService = {
  /**
   * Lists all active bots for a workspace with subscriber counts.
   */
  async listByWorkspace(
    db: PrismaClient,
    workspaceId: string,
  ): Promise<BotWithSubscriberCount[]> {
    return db.bot.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as unknown as BotWithSubscriberCount[];
  },

  /**
   * Gets a single bot by ID within a workspace.
   */
  async getById(
    db: PrismaClient,
    workspaceId: string,
    botId: string,
  ) {
    const bot = await db.bot.findFirst({
      where: { id: botId, workspaceId, deletedAt: null },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
    });

    if (!bot) {
      throw new NotFoundError("Bot not found");
    }

    return bot;
  },

  /**
   * Creates a new bot: validates token via Telegram API, encrypts it,
   * checks uniqueness, generates webhook secret, and registers webhook.
   */
  async create(
    db: PrismaClient,
    workspaceId: string,
    input: Pick<AddBotInput, "token">,
  ) {
    // 1. Validate token with Telegram
    const botInfo = await validateToken(input.token);

    // 2. Check uniqueness by telegram_bot_id
    const existing = await db.bot.findUnique({
      where: { telegramBotId: BigInt(botInfo.id) },
    });

    if (existing && existing.deletedAt === null) {
      throw new BadRequestError("This bot is already connected to a workspace");
    }

    // 3. Encrypt the token
    const tokenEncrypted = encrypt(input.token);

    // 4. Generate webhook secret token
    const webhookSecretToken = randomBytes(WEBHOOK_SECRET_LENGTH / 2).toString("hex");

    // 5. Build webhook URL
    const webhookUrl = `${env.WEBHOOK_BASE_URL}${WEBHOOK_PATH_PATTERN}/${""}`; // placeholder, updated after creation

    // 6. Create the bot record
    const bot = await db.bot.create({
      data: {
        workspaceId,
        telegramBotId: BigInt(botInfo.id),
        telegramBotUsername: botInfo.username,
        displayName: botInfo.first_name,
        tokenEncrypted,
        webhookSecretToken,
        status: BotStatus.ACTIVE,
        welcomeMessage: DEFAULT_WELCOME_MESSAGE,
      },
    });

    // 7. Register webhook with Telegram (now we have the bot ID)
    const finalWebhookUrl = `${env.WEBHOOK_BASE_URL}${WEBHOOK_PATH_PATTERN}/${bot.id}`;
    await setWebhook(input.token, finalWebhookUrl, webhookSecretToken);

    // 8. Update bot with the webhook URL
    const updatedBot = await db.bot.update({
      where: { id: bot.id },
      data: { webhookUrl: finalWebhookUrl },
    });

    // 9. Set default commands
    await setMyCommands(input.token, [
      { command: "start", description: "Start the bot" },
    ]);

    return updatedBot;
  },

  /**
   * Updates a bot's configuration (welcome message, menu config).
   */
  async update(
    db: PrismaClient,
    workspaceId: string,
    botId: string,
    input: Pick<UpdateBotInput, "welcomeMessage" | "menuConfig">,
  ) {
    const bot = await this.getById(db, workspaceId, botId);

    const updateData: Record<string, unknown> = {};

    if (input.welcomeMessage !== undefined) {
      updateData.welcomeMessage = input.welcomeMessage;
    }

    if (input.menuConfig !== undefined) {
      updateData.menuConfig = input.menuConfig;

      // If menu config is provided, update Telegram commands
      if (input.menuConfig) {
        const token = decrypt(bot.tokenEncrypted);
        const commands: BotCommand[] = input.menuConfig.map(
          (item: { command: string; description: string }) => ({
            command: item.command,
            description: item.description,
          }),
        );
        // Always include /start
        if (!commands.some((c) => c.command === "start")) {
          commands.unshift({ command: "start", description: "Start the bot" });
        }
        await setMyCommands(token, commands);
      }
    }

    return db.bot.update({
      where: { id: botId },
      data: updateData,
    });
  },

  /**
   * Soft-deletes a bot and unregisters its webhook with Telegram.
   */
  async delete(
    db: PrismaClient,
    workspaceId: string,
    botId: string,
  ) {
    const bot = await this.getById(db, workspaceId, botId);

    // Unregister webhook
    try {
      const token = decrypt(bot.tokenEncrypted);
      await deleteWebhook(token);
    } catch {
      // If webhook unregistration fails (e.g. token revoked), continue with soft delete
    }

    return db.bot.update({
      where: { id: botId },
      data: {
        status: BotStatus.DELETED,
        deletedAt: new Date(),
        webhookUrl: null,
      },
    });
  },

  /**
   * Gets the decrypted token for a bot (used internally by webhook handler).
   */
  async getDecryptedToken(
    db: PrismaClient,
    botId: string,
  ): Promise<string> {
    const bot = await db.bot.findUnique({
      where: { id: botId },
    });

    if (!bot || bot.deletedAt !== null) {
      throw new NotFoundError("Bot not found");
    }

    return decrypt(bot.tokenEncrypted);
  },
};
