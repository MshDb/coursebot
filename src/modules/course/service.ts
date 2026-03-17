import type { PrismaClient } from "@prisma/client";
import type { CreateCourseInput, UpdateCourseInput, AddLinkInput, LinkToBotInput } from "./schema";

export const CourseService = {
  async list(db: PrismaClient, workspaceId: string) {
    return db.course.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        _count: { select: { botLinks: true, externalLinks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(db: PrismaClient, workspaceId: string, id: string) {
    const course = await db.course.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        externalLinks: { orderBy: { order: "asc" } },
        botLinks: {
          include: { bot: true },
        },
      },
    });

    if (!course) throw new Error("Course not found");
    return course;
  },

  async create(db: PrismaClient, workspaceId: string, input: CreateCourseInput) {
    return db.course.create({
      data: {
        workspaceId,
        name: input.name,
        description: input.description || null,
        price: input.price,
        status: "DRAFT",
      },
    });
  },

  async update(db: PrismaClient, workspaceId: string, id: string, input: Omit<UpdateCourseInput, "id">) {
    await this.getById(db, workspaceId, id); // Ensure it exists and belongs to workspace
    return db.course.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
        price: input.price,
      },
    });
  },

  async publish(db: PrismaClient, workspaceId: string, id: string) {
    const course = await this.getById(db, workspaceId, id);
    if (course.status === "ARCHIVED") throw new Error("Cannot publish archived course");
    
    return db.course.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
  },

  async archive(db: PrismaClient, workspaceId: string, id: string) {
    await this.getById(db, workspaceId, id);
    return db.course.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  },

  async addLink(db: PrismaClient, workspaceId: string, input: AddLinkInput) {
    await this.getById(db, workspaceId, input.courseId);
    return db.courseExternalLink.create({
      data: {
        courseId: input.courseId,
        url: input.url,
        title: input.title || "",
      },
    });
  },

  async removeLink(db: PrismaClient, workspaceId: string, courseId: string, linkId: string) {
    await this.getById(db, workspaceId, courseId);
    return db.courseExternalLink.delete({
      where: { id: linkId },
    });
  },

  async linkToBot(db: PrismaClient, workspaceId: string, input: LinkToBotInput) {
    await this.getById(db, workspaceId, input.courseId);
    // Verify bot belongs to workspace
    const bot = await db.bot.findFirst({ where: { id: input.botId, workspaceId } });
    if (!bot) throw new Error("Bot not found in workspace");

    return db.botCourse.create({
      data: {
        courseId: input.courseId,
        botId: input.botId,
      },
    });
  },

  async unlinkFromBot(db: PrismaClient, workspaceId: string, courseId: string, botId: string) {
    await this.getById(db, workspaceId, courseId);
    return db.botCourse.delete({
      where: { 
        botId_courseId: {
          botId,
          courseId,
        }
      },
    });
  },

  async delete(db: PrismaClient, workspaceId: string, id: string) {
    await this.getById(db, workspaceId, id);
    return db.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async reorderLinks(db: PrismaClient, workspaceId: string, input: { courseId: string; linkIds: string[] }) {
    await this.getById(db, workspaceId, input.courseId);
    
    return db.$transaction(
      input.linkIds.map((id, index) => 
        db.courseExternalLink.update({
          where: { id, courseId: input.courseId },
          data: { order: index },
        })
      )
    );
  },
};

