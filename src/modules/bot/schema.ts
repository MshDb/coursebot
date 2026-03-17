import { z } from "zod";

/**
 * Schema for adding a new bot by providing its Telegram API token.
 */
export const addBotSchema = z.object({
  workspaceId: z.string().cuid(),
  token: z.string().min(1, "Bot token is required"),
});
export type AddBotInput = z.infer<typeof addBotSchema>;

/**
 * Schema for updating bot configuration (welcome message, menu config).
 */
export const updateBotSchema = z.object({
  workspaceId: z.string().cuid(),
  botId: z.string().cuid(),
  welcomeMessage: z.string().max(4096, "Welcome message is too long").nullable().optional(),
  menuConfig: z
    .array(
      z.object({
        command: z.string().min(1).max(32),
        description: z.string().min(1).max(256),
      }),
    )
    .max(100)
    .nullable()
    .optional(),
});
export type UpdateBotInput = z.infer<typeof updateBotSchema>;
