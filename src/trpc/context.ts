import { initTRPC, TRPCError } from "@trpc/server";
// import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { db } from "@/lib/db";
// import { auth } from "@/auth"; // Will be added in Phase 5

import { auth } from "@/auth";

/**
 * 1. CONTEXT
 * This section defines the "contexts" that are available in the backend API.
 */
export const createTRPCContext = async (opts?: { req?: Request; resHeaders?: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    headers: opts?.req?.headers,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE BUILDS
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Workspace (authenticated + authorized) procedure
 * Requires { workspaceId: string } in input.
 * Verifies membership and injects workspace into ctx.
 */
export const workspaceProcedure = protectedProcedure
  .input(z.object({ workspaceId: z.string() }).passthrough())
  .use(async ({ ctx, input, next, type, path }) => {
    const workspace = await ctx.db.workspace.findUnique({
      where: { id: input.workspaceId },
      include: {
        members: {
          where: { userId: ctx.session.user.id },
        },
        subscription: true,
      },
    });

    if (!workspace) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
    }

    if (workspace.members.length === 0) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this workspace" });
    }

    const isLapsed = !workspace.subscription || 
                     (workspace.subscription.status !== "ACTIVE" && workspace.subscription.status !== "TRIAL");

    if (type === "mutation" && isLapsed && path !== "workspace.activateTrial" && path !== "workspace.delete") {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "Your workspace subscription has lapsed. Please activate a trial or subscription to perform this action." 
      });
    }

    return next({
      ctx: {
        ...ctx,
        workspace,
      },
    });
  });
