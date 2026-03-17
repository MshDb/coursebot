import { createTRPCRouter, publicProcedure } from "./context";
import { authRouter } from "@/modules/auth/router";
import { workspaceRouter } from "@/modules/workspace/router";
import { botRouter } from "@/modules/bot/router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // Health check procedure (T028)
  health: publicProcedure.query(() => {
    return { status: "ok", timestamp: new Date() };
  }),
  auth: authRouter,
  workspace: workspaceRouter,
  bot: botRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
