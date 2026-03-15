import { createTRPCRouter, protectedProcedure, workspaceProcedure } from "@/trpc/context";
import { createWorkspaceSchema, updateWorkspaceSchema } from "./schema";
import { WorkspaceService } from "./service";

export const workspaceRouter = createTRPCRouter({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return WorkspaceService.list(ctx.db, ctx.session.user.id!);
    }),

  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      return WorkspaceService.create(ctx.db, ctx.session.user.id!, input);
    }),

  getById: workspaceProcedure
    .query(({ ctx }) => {
      return ctx.workspace;
    }),

  update: workspaceProcedure
    .input(updateWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      return WorkspaceService.update(ctx.db, input.workspaceId, ctx.session.user.id!, input);
    }),

  delete: workspaceProcedure
    .mutation(async ({ ctx, input }) => {
      return WorkspaceService.delete(ctx.db, input.workspaceId, ctx.session.user.id!);
    }),

  activateTrial: workspaceProcedure
    .mutation(async ({ ctx, input }) => {
      return WorkspaceService.activateTrial(ctx.db, input.workspaceId, ctx.session.user.id!);
    }),
});
