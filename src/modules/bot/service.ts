import type { PrismaClient } from "@prisma/client";
import { Prisma, BotStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  validateToken,
  setWebhook,
  deleteWebhook,
  setMyCommands,
  getMyCommands,
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

    // 5. Build placeholder webhook URL
    const webhookUrl = `${env.WEBHOOK_BASE_URL}${WEBHOOK_PATH_PATTERN}/${""}`;

    // 6. Fetch existing commands from Telegram
    let menuConfig: { command: string; description: string }[] | null = null;
    try {
      const existingCommands = await getMyCommands(input.token);
      if (existingCommands && existingCommands.length > 0) {
        menuConfig = existingCommands;
      }
    } catch {
      // Ignore errors fetching commands; fall back to null
    }

    // 7. Create or Restore the bot record
    let bot;
    if (existing) {
      // Restore soft-deleted bot
      bot = await db.bot.update({
        where: { id: existing.id },
        data: {
          workspaceId,
          telegramBotUsername: botInfo.username,
          displayName: botInfo.first_name,
          tokenEncrypted,
          webhookSecretToken,
          status: BotStatus.ACTIVE,
          deletedAt: null, // restore
          menuConfig: menuConfig ?? existing.menuConfig ?? Prisma.DbNull, // Update with incoming or keep existing
          // Keep prior welcome message if we have one
        },
      });
    } else {
      // Completely new bot
      bot = await db.bot.create({
        data: {
          workspaceId,
          telegramBotId: BigInt(botInfo.id),
          telegramBotUsername: botInfo.username,
          displayName: botInfo.first_name,
          tokenEncrypted,
          webhookSecretToken,
          status: BotStatus.ACTIVE,
          welcomeMessage: DEFAULT_WELCOME_MESSAGE,
          menuConfig: menuConfig ?? Prisma.DbNull,
        },
      });
    }

    // 8. Register webhook with Telegram (now we have the bot ID)
    const finalWebhookUrl = `${env.WEBHOOK_BASE_URL}${WEBHOOK_PATH_PATTERN}/${bot.id}`;
    let registrationError = false;

    try {
      await setWebhook(input.token, finalWebhookUrl, webhookSecretToken);
    } catch (error) {
      console.error("Failed to set webhook:", error);
      registrationError = true;
    }

    // 9. Update bot with the webhook URL (and status if error)
    const updatedBot = await db.bot.update({
      where: { id: bot.id },
      data: { 
        webhookUrl: finalWebhookUrl,
        status: registrationError ? BotStatus.ERROR : BotStatus.ACTIVE
      },
    });

    // 10. Set commands in Telegram (ensure start command exists)
    try {
      let commandsToSet = menuConfig || [];
      if (!commandsToSet.some(c => c.command === "start")) {
        commandsToSet = [{ command: "start", description: "Start the bot" }, ...commandsToSet];
        await setMyCommands(input.token, commandsToSet);
        // Sync back to db
        await db.bot.update({
          where: { id: bot.id },
          data: { menuConfig: commandsToSet }
        });
      }
    } catch (error) {
      console.error("Failed to set commands:", error);
      // If setting commands failed but webhook succeeded (unlikely but possible), 
      // we might still want to mark as ERROR or just log it.
      // For now, let's keep the status from the webhook step.
    }

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
      updateData.menuConfig = input.menuConfig ?? Prisma.DbNull;

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
