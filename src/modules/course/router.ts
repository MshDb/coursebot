import { createTRPCRouter, workspaceProcedure } from "@/trpc/context";
import { createCourseSchema, updateCourseSchema, addLinkSchema, linkToBotSchema } from "./schema";
import { CourseService } from "./service";
import { z } from "zod";

export const courseRouter = createTRPCRouter({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return CourseService.list(ctx.db, ctx.workspace.id);
  }),
  getById: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return CourseService.getById(ctx.db, ctx.workspace.id, input.id);
    }),
  create: workspaceProcedure
    .input(createCourseSchema)
    .mutation(async ({ ctx, input }) => {
      return CourseService.create(ctx.db, ctx.workspace.id, input);
    }),
  update: workspaceProcedure
    .input(updateCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return CourseService.update(ctx.db, ctx.workspace.id, id, data);
    }),
  publish: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CourseService.publish(ctx.db, ctx.workspace.id, input.id);
    }),
  archive: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CourseService.archive(ctx.db, ctx.workspace.id, input.id);
    }),
  addLink: workspaceProcedure
    .input(addLinkSchema)
    .mutation(async ({ ctx, input }) => {
      return CourseService.addLink(ctx.db, ctx.workspace.id, input);
    }),
  removeLink: workspaceProcedure
    .input(z.object({ courseId: z.string(), linkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CourseService.removeLink(ctx.db, ctx.workspace.id, input.courseId, input.linkId);
    }),
  linkToBot: workspaceProcedure
    .input(linkToBotSchema)
    .mutation(async ({ ctx, input }) => {
      return CourseService.linkToBot(ctx.db, ctx.workspace.id, input);
    }),
  unlinkFromBot: workspaceProcedure
    .input(z.object({ courseId: z.string(), botId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CourseService.unlinkFromBot(ctx.db, ctx.workspace.id, input.courseId, input.botId);
    }),
  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CourseService.delete(ctx.db, ctx.workspace.id, input.id);
    }),
  reorderLinks: workspaceProcedure
    .input(z.object({ courseId: z.string(), linkIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      return CourseService.reorderLinks(ctx.db, ctx.workspace.id, input);
    }),
});
