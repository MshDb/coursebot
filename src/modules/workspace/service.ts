import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus, SubscriptionTier } from "@prisma/client";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./schema";
import { TRIAL_DURATION_DAYS } from "./constants";
import { BadRequestError, NotFoundError } from "@/lib/errors";

function generateBaseSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const WorkspaceService = {
  async list(db: PrismaClient, userId: string) {
    return db.workspace.findMany({
      where: {
        members: { some: { userId } },
        deletedAt: null,
      },
      include: {
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(db: PrismaClient, workspaceId: string, userId: string) {
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        members: { some: { userId } },
        deletedAt: null,
      },
      include: {
        subscription: true,
        members: true,
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  },

  async create(db: PrismaClient, userId: string, input: CreateWorkspaceInput) {
    const baseSlug = generateBaseSlug(input.name) || "workspace";
    let slug = baseSlug;
    let counter = 1;

    // Slug uniqueness check
    while (true) {
      const existing = await db.workspace.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    return db.workspace.create({
      data: {
        name: input.name,
        slug,
        createdById: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.TRIAL,
            trialEndsAt,
          },
        },
      },
      include: {
        subscription: true,
      },
    });
  },

  async update(db: PrismaClient, workspaceId: string, userId: string, input: UpdateWorkspaceInput) {
    await this.getById(db, workspaceId, userId);

    return db.workspace.update({
      where: { id: workspaceId },
      data: { name: input.name },
      include: { subscription: true },
    });
  },

  async delete(db: PrismaClient, workspaceId: string, userId: string) {
    const workspace = await this.getById(db, workspaceId, userId);

    if (
      workspace.subscription &&
      (workspace.subscription.status === SubscriptionStatus.TRIAL ||
        workspace.subscription.status === SubscriptionStatus.ACTIVE)
    ) {
      throw new BadRequestError("Cannot delete a workspace with an active or trial subscription. Please cancel it first.");
    }

    return db.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });
  },

  async activateTrial(db: PrismaClient, workspaceId: string, userId: string) {
    await this.getById(db, workspaceId, userId);

    const subscription = await db.subscription.findUnique({
      where: { workspaceId },
    });

    if (subscription) {
      throw new BadRequestError("Workspace already has a subscription process started");
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    return db.subscription.create({
      data: {
        workspaceId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.TRIAL,
        trialEndsAt,
      },
    });
  },
};
