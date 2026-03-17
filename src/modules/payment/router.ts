import { createTRPCRouter, workspaceProcedure } from "@/trpc/context";
import { z } from "zod";

export const paymentRouter = createTRPCRouter({
  listByCourse: workspaceProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.coursePurchase.findMany({
        where: { courseId: input.courseId },
      });
    }),
});
