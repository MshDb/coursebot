import { z } from "zod";

export const createPurchaseSchema = z.object({
  endUserId: z.string().cuid(),
  courseId: z.string().cuid(),
  amount: z.number().min(0),
});

export const checkAccessSchema = z.object({
  courseId: z.string().cuid(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type CheckAccessInput = z.infer<typeof checkAccessSchema>;

