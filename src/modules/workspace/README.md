# Workspace Module

The Workspace module handles the core tenancy mechanics of CourseBot. It separates customer data such that each user context operates within an isolated boundary.

## Models
- **Workspace**: The root entity representing a customer's workspace.
- **WorkspaceMembership**: Manages the n:m relation between Users and Workspaces, encoding Roles (e.g. OWNER).
- **Subscription**: Contains the Stripe/LiqPay billing state (TRIAL, ACTIVE, PAST_DUE, etc.) bounded to the workspace.

## Key APIs
- `WorkspaceService`: Server-side service handling Prisma queries, slug generation, trial activation, and soft deletion.
- `workspaceRouter`: tRPC router exposing the workspace logic to the client.
- `workspaceProcedure`: tRPC middleware that resolves and injects `workspace` into `ctx` based on `input.workspaceId`. Also handles `Subscription` checks for active access control.
