import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Workspace name is too long"),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1, "Workspace name is required").max(100, "Workspace name is too long"),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
