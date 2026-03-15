import { redirect } from "next/navigation";
import { Layout } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { WorkspaceService } from "@/modules/workspace/service";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Select Workspace",
};

export default async function WorkspaceSelectorPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTES.LOGIN);
  }

  const workspaces = await WorkspaceService.list(db, session.user.id);

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Layout className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No workspaces found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          Create a workspace to start managing your bots, courses, and subscribers.
        </p>
        <CreateWorkspaceDialog />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Select a workspace or create a new one.
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace: any) => (
          <Card key={workspace.id} className="flex flex-col hover:border-primary transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="line-clamp-1" title={workspace.name}>{workspace.name}</CardTitle>
                {workspace.subscription ? (
                  <Badge variant={workspace.subscription.status === "ACTIVE" ? "default" : workspace.subscription.status === "TRIAL" ? "secondary" : "destructive"}>
                    {workspace.subscription.status}
                  </Badge>
                ) : (
                  <Badge variant="outline">No Plan</Badge>
                )}
              </div>
            </CardHeader>
            <CardFooter className="mt-auto pt-4">
              <Button nativeButton={false} render={<Link href={ROUTES.WORKSPACE(workspace.id)} />} className="w-full">
                Enter Workspace
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
