import { z } from "zod";

export const createCourseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive").default(0),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  id: z.string().cuid("Invalid course ID"),
});

export const addLinkSchema = z.object({
  courseId: z.string().cuid(),
  url: z.string().url("Invalid URL"),
  title: z.string().optional().or(z.literal("")),
});

export const linkToBotSchema = z.object({
  courseId: z.string().cuid(),
  botId: z.string().cuid(),
});

export const reorderLinksSchema = z.object({
  courseId: z.string().cuid(),
  linkIds: z.array(z.string().cuid()),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type AddLinkInput = z.infer<typeof addLinkSchema>;
export type LinkToBotInput = z.infer<typeof linkToBotSchema>;
export type ReorderLinksInput = z.infer<typeof reorderLinksSchema>;

