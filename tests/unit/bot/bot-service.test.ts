import { describe, it, expect, vi, beforeEach } from "vitest";
import { BotService } from "@/modules/bot/service";

// Mock dependencies
vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
  decrypt: vi.fn((text: string) => text.replace("encrypted:", "")),
}));

vi.mock("@/lib/telegram", () => ({
  validateToken: vi.fn(),
  setWebhook: vi.fn(),
  deleteWebhook: vi.fn(),
  setMyCommands: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: {
    ENCRYPTION_KEY: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    WEBHOOK_BASE_URL: "https://example.com",
  },
}));

import { validateToken, setWebhook, deleteWebhook, setMyCommands } from "@/lib/telegram";
import { encrypt } from "@/lib/encryption";

const mockValidateToken = vi.mocked(validateToken);
const mockSetWebhook = vi.mocked(setWebhook);
const mockDeleteWebhook = vi.mocked(deleteWebhook);
const mockSetMyCommands = vi.mocked(setMyCommands);

// Create a mock PrismaClient
function createMockDb() {
  return {
    bot: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as Parameters<typeof BotService.listByWorkspace>[0];
}

describe("BotService", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  describe("listByWorkspace", () => {
    it("should list bots for a workspace excluding deleted", async () => {
      const mockBots = [
        { id: "bot1", displayName: "Test Bot", status: "ACTIVE", _count: { subscribers: 5 } },
      ];
      (db.bot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockBots);

      const result = await BotService.listByWorkspace(db, "workspace1");

      expect(db.bot.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "workspace1", deletedAt: null },
        include: { _count: { select: { subscribers: true } } },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockBots);
    });
  });

  describe("create", () => {
    it("should validate token, encrypt, check uniqueness, and register webhook", async () => {
      mockValidateToken.mockResolvedValue({
        id: 123456789,
        is_bot: true,
        first_name: "TestBot",
        username: "testbot",
      });

      (db.bot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null); // No existing bot
      (db.bot.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "new-bot-id",
        telegramBotId: BigInt(123456789),
        telegramBotUsername: "testbot",
        displayName: "TestBot",
        status: "ACTIVE",
      });
      (db.bot.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "new-bot-id",
        webhookUrl: "https://example.com/api/webhooks/telegram/new-bot-id",
      });
      mockSetWebhook.mockResolvedValue(undefined);
      mockSetMyCommands.mockResolvedValue(undefined);

      const result = await BotService.create(db, "workspace1", { token: "test-token" });

      expect(mockValidateToken).toHaveBeenCalledWith("test-token");
      expect(encrypt).toHaveBeenCalledWith("test-token");
      expect(db.bot.findUnique).toHaveBeenCalledWith({
        where: { telegramBotId: BigInt(123456789) },
      });
      expect(db.bot.create).toHaveBeenCalled();
      expect(mockSetWebhook).toHaveBeenCalled();
      expect(mockSetMyCommands).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should reject tokens already connected to another workspace", async () => {
      mockValidateToken.mockResolvedValue({
        id: 123456789,
        is_bot: true,
        first_name: "TestBot",
        username: "testbot",
      });

      (db.bot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "existing-bot",
        deletedAt: null,
      });

      await expect(
        BotService.create(db, "workspace1", { token: "duplicate-token" }),
      ).rejects.toThrow("already connected");
    });
  });

  describe("delete", () => {
    it("should unregister webhook and soft delete", async () => {
      (db.bot.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "bot1",
        tokenEncrypted: "encrypted:test-token",
        status: "ACTIVE",
      });
      mockDeleteWebhook.mockResolvedValue(undefined);
      (db.bot.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "bot1",
        status: "DELETED",
        deletedAt: expect.any(Date),
      });

      await BotService.delete(db, "workspace1", "bot1");

      expect(mockDeleteWebhook).toHaveBeenCalledWith("test-token");
      expect(db.bot.update).toHaveBeenCalledWith({
        where: { id: "bot1" },
        data: {
          status: "DELETED",
          deletedAt: expect.any(Date),
          webhookUrl: null,
        },
      });
    });

    it("should continue with soft delete even if webhook unregistration fails", async () => {
      (db.bot.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "bot1",
        tokenEncrypted: "encrypted:test-token",
        status: "ACTIVE",
      });
      mockDeleteWebhook.mockRejectedValue(new Error("Token revoked"));
      (db.bot.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "bot1",
        status: "DELETED",
      });

      // Should not throw
      await BotService.delete(db, "workspace1", "bot1");

      expect(db.bot.update).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should throw NotFoundError when bot does not exist", async () => {
      (db.bot.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        BotService.getById(db, "workspace1", "nonexistent"),
      ).rejects.toThrow("Bot not found");
    });
  });
});
