import { initTRPC, TRPCError } from "@trpc/server";
// import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
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
 * (Workspace check will be implemented in future specs per AGENTS.md)
 */
export const workspaceProcedure = protectedProcedure.use(({ next }) => {
  // Future: Check workspace membership here
  return next();
});
