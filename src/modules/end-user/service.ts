import type { PrismaClient } from "@prisma/client";

/**
 * EndUser service — manages Telegram end users.
 * Pure business logic, portable (no framework dependencies).
 */
export const EndUserService = {
  /**
   * Finds or creates an EndUser by Telegram user ID (global dedup).
   * Updates user info (name, username) on each interaction.
   */
  async findOrCreate(
    db: PrismaClient,
    telegramUserId: bigint,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      languageCode?: string | null;
    },
  ) {
    return db.endUser.upsert({
      where: { telegramUserId },
      create: {
        telegramUserId,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        username: data.username ?? null,
        languageCode: data.languageCode ?? null,
      },
      update: {
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        username: data.username ?? undefined,
        languageCode: data.languageCode ?? undefined,
      },
    });
  },
};
