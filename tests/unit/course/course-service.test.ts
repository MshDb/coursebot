import { describe, it, expect, vi, beforeEach } from "vitest";
import { CourseService } from "@/modules/course/service";

// Create a mock PrismaClient
function createMockDb() {
  return {
    course: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    courseExternalLink: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    botCourse: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    coursePurchase: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  } as unknown as Parameters<typeof CourseService.list>[0] & { $transaction: any };
}

describe("CourseService", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a draft course", async () => {
      (db.course.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", status: "DRAFT" });

      const result = await CourseService.create(db, "workspace1", {
        name: "Test Course",
        price: 100,
      });

      expect(db.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: "workspace1",
          name: "Test Course",
          price: 100,
          status: "DRAFT",
        }),
      });
      expect(result.id).toEqual("course1");
    });
  });

  describe("publish", () => {
    it("should transition draft to published", async () => {
      (db.course.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", status: "DRAFT", workspaceId: "workspace1" });
      (db.course.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", status: "PUBLISHED" });

      const result = await CourseService.publish(db, "workspace1", "course1");
      expect(db.course.update).toHaveBeenCalledWith({
        where: { id: "course1" },
        data: { status: "PUBLISHED" },
      });
      expect(result.status).toBe("PUBLISHED");
    });
  });

  describe("archive", () => {
    it("should transition published to archived", async () => {
      (db.course.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", status: "PUBLISHED", workspaceId: "workspace1" });
      (db.course.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", status: "ARCHIVED" });

      const result = await CourseService.archive(db, "workspace1", "course1");
      expect(db.course.update).toHaveBeenCalledWith({
        where: { id: "course1" },
        data: { status: "ARCHIVED" },
      });
      expect(result.status).toBe("ARCHIVED");
    });
  });

  describe("delete", () => {
    it("should soft-delete the course", async () => {
      (db.course.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", workspaceId: "workspace1" });
      (db.course.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", deletedAt: new Date() });

      await CourseService.delete(db as any, "workspace1", "course1");

      expect(db.course.update).toHaveBeenCalledWith({
        where: { id: "course1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("reorderLinks", () => {
    it("should update link orders in a transaction", async () => {
      (db.course.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "course1", workspaceId: "workspace1" });

      await CourseService.reorderLinks(db as any, "workspace1", {
        courseId: "course1",
        linkIds: ["link2", "link1"],
      });

      expect(db.$transaction).toHaveBeenCalled();
      expect(db.courseExternalLink.update).toHaveBeenCalledWith({
        where: { id: "link2", courseId: "course1" },
        data: { order: 0 },
      });
      expect(db.courseExternalLink.update).toHaveBeenCalledWith({
        where: { id: "link1", courseId: "course1" },
        data: { order: 1 },
      });
    });
  });
});
