import type { Workspace, WorkspaceMembership, Subscription } from "@prisma/client";

export interface WorkspaceWithDetails extends Workspace {
  subscription: Subscription | null;
  members?: WorkspaceMembership[];
}
