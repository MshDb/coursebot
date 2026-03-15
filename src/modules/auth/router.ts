import { createTRPCRouter, publicProcedure } from "@/trpc/context";
import { registerSchema } from "./schema";
import { AuthService } from "./service";

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    return AuthService.register(ctx.db, input);
  }),
});
