import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspaceService } from "@/modules/workspace/service";
import { SubscriptionStatus } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@/lib/errors";

const mockDb = {
  workspace: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as any;

describe("WorkspaceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("generates a slug and creates workspace with trial", async () => {
      mockDb.workspace.findUnique.mockResolvedValueOnce(null);
      mockDb.workspace.create.mockResolvedValueOnce({ id: "ws-1", name: "Test Corp", slug: "test-corp" });

      const result = await WorkspaceService.create(mockDb, "user-1", { name: "Test Corp" });

      expect(mockDb.workspace.findUnique).toHaveBeenCalledWith({ where: { slug: "test-corp" } });
      expect(mockDb.workspace.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: "Test Corp",
          slug: "test-corp",
          createdById: "user-1",
        })
      }));
      expect(result.id).toBe("ws-1");
    });

    it("appends counter if slug is taken", async () => {
      mockDb.workspace.findUnique
        .mockResolvedValueOnce({ id: "taken" })
        .mockResolvedValueOnce(null);
      
      mockDb.workspace.create.mockResolvedValueOnce({ id: "ws-2" });

      await WorkspaceService.create(mockDb, "user-1", { name: "Test Corp" });

      expect(mockDb.workspace.findUnique).toHaveBeenNthCalledWith(1, { where: { slug: "test-corp" } });
      expect(mockDb.workspace.findUnique).toHaveBeenNthCalledWith(2, { where: { slug: "test-corp-1" } });
      expect(mockDb.workspace.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ slug: "test-corp-1" })
      }));
    });
  });

  describe("getById", () => {
    it("returns workspace if found and membership matches", async () => {
      mockDb.workspace.findFirst.mockResolvedValueOnce({ id: "ws-1", name: "Test" });
      const result = await WorkspaceService.getById(mockDb, "ws-1", "user-1");
      expect(result.id).toBe("ws-1");
    });

    it("throws NotFoundError if workspace missing or no membership", async () => {
      mockDb.workspace.findFirst.mockResolvedValueOnce(null);
      await expect(WorkspaceService.getById(mockDb, "ws-1", "user-1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("throws BadRequestError if subscription is active", async () => {
      mockDb.workspace.findFirst.mockResolvedValueOnce({
        id: "ws-1",
        subscription: { status: SubscriptionStatus.ACTIVE }
      });

      await expect(WorkspaceService.delete(mockDb, "ws-1", "user-1")).rejects.toThrow(BadRequestError);
    });

    it("soft deletes if safe", async () => {
      mockDb.workspace.findFirst.mockResolvedValueOnce({
        id: "ws-1",
        subscription: null
      });

      await WorkspaceService.delete(mockDb, "ws-1", "user-1");
      expect(mockDb.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws-1" },
        data: { deletedAt: expect.any(Date) }
      });
    });
  });
});
