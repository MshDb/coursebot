import { z } from "zod";

/**
 * End-user schemas — used for internal validation.
 */
export const telegramUserSchema = z.object({
  telegramUserId: z.bigint(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  languageCode: z.string().nullable().optional(),
});
export type TelegramUserInput = z.infer<typeof telegramUserSchema>;
