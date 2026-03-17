import { describe, it, expect, vi, beforeEach } from "vitest";

// This integration test validates the full webhook flow:
// connect bot → /start webhook → verify EndUser + BotSubscriber created + welcome message sent
//
// Note: This is a structural integration test using mocked Telegram API.
// Full end-to-end testing with real Telegram requires a live bot token.

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
  decrypt: vi.fn((text: string) => text.replace("encrypted:", "")),
}));

vi.mock("@/lib/telegram", () => ({
  validateToken: vi.fn(),
  setWebhook: vi.fn(),
  deleteWebhook: vi.fn(),
  sendMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
  setMyCommands: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    ENCRYPTION_KEY: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    WEBHOOK_BASE_URL: "https://example.com",
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    bot: {
      findUnique: vi.fn(),
    },
    endUser: {
      upsert: vi.fn(),
    },
    botSubscriber: {
      upsert: vi.fn(),
    },
  },
}));

import { sendMessage } from "@/lib/telegram";
import { db } from "@/lib/db";

const mockSendMessage = vi.mocked(sendMessage);
const mockDb = vi.mocked(db);

describe("Bot Webhook Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("/start command flow", () => {
    it("should create EndUser, BotSubscriber, and send welcome message", async () => {
      // Setup: Bot exists with a welcome message
      const mockBot = {
        id: "bot-123",
        workspaceId: "ws-1",
        tokenEncrypted: "encrypted:test-token-123",
        welcomeMessage: "Welcome to our bot! 🎉",
        webhookSecretToken: "secret-abc",
        status: "ACTIVE",
        deletedAt: null,
      };

      (mockDb.bot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockBot);

      const mockEndUser = {
        id: "eu-1",
        telegramUserId: BigInt(999),
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        languageCode: "en",
      };

      (mockDb.endUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(mockEndUser);
      (mockDb.botSubscriber.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "bs-1",
        botId: "bot-123",
        endUserId: "eu-1",
        status: "ACTIVE",
      });
      mockSendMessage.mockResolvedValue(undefined);

      // Simulate the webhook POST request
      const telegramUpdate = {
        update_id: 12345,
        message: {
          message_id: 1,
          from: {
            id: 999,
            is_bot: false,
            first_name: "John",
            last_name: "Doe",
            username: "johndoe",
            language_code: "en",
          },
          chat: { id: 999, type: "private" },
          text: "/start",
          entities: [{ type: "bot_command", offset: 0, length: 6 }],
        },
      };

      // Import the route handler dynamically to use mocks
      const { POST } = await import("@/app/api/webhooks/telegram/[botId]/route");

      const request = new Request("http://localhost:3000/api/webhooks/telegram/bot-123", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": "secret-abc",
        },
        body: JSON.stringify(telegramUpdate),
      });

      const response = await POST(request as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ botId: "bot-123" }),
      });

      expect(response.status).toBe(200);

      // Verify EndUser was upserted
      expect(mockDb.endUser.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { telegramUserId: BigInt(999) },
          create: expect.objectContaining({
            telegramUserId: BigInt(999),
            firstName: "John",
          }),
        }),
      );

      // Verify BotSubscriber was upserted
      expect(mockDb.botSubscriber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            botId_endUserId: {
              botId: "bot-123",
              endUserId: "eu-1",
            },
          },
        }),
      );

      // Verify welcome message was sent
      expect(mockSendMessage).toHaveBeenCalledWith(
        "test-token-123",
        999,
        "Welcome to our bot! 🎉",
      );
    });

    it("should reject requests with invalid secret token", async () => {
      const mockBot = {
        id: "bot-123",
        webhookSecretToken: "correct-secret",
        status: "ACTIVE",
        deletedAt: null,
      };
      (mockDb.bot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockBot);

      const { POST } = await import("@/app/api/webhooks/telegram/[botId]/route");

      const request = new Request("http://localhost:3000/api/webhooks/telegram/bot-123", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": "wrong-secret",
        },
        body: JSON.stringify({ update_id: 1 }),
      });

      const response = await POST(request as unknown as import("next/server").NextRequest, {
        params: Promise.resolve({ botId: "bot-123" }),
      });

      expect(response.status).toBe(403);
    });
  });
});
