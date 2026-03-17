import { createTRPCRouter, workspaceProcedure } from "@/trpc/context";
import { addBotSchema, updateBotSchema } from "./schema";
import { BotService } from "./service";
import { z } from "zod";

export const botRouter = createTRPCRouter({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return BotService.listByWorkspace(ctx.db, ctx.workspace.id);
  }),

  create: workspaceProcedure
    .input(addBotSchema)
    .mutation(async ({ ctx, input }) => {
      return BotService.create(ctx.db, ctx.workspace.id, input);
    }),

  getById: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), botId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return BotService.getById(ctx.db, ctx.workspace.id, input.botId);
    }),

  update: workspaceProcedure
    .input(updateBotSchema)
    .mutation(async ({ ctx, input }) => {
      return BotService.update(ctx.db, ctx.workspace.id, input.botId, input);
    }),

  delete: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), botId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return BotService.delete(ctx.db, ctx.workspace.id, input.botId);
    }),
});
