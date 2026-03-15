import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { WorkspaceService } from "@/modules/workspace/service";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect(ROUTES.LOGIN);
  }

  const { id } = await params;

  // Verify membership by trying to get it
  let workspace;
  try {
    workspace = await WorkspaceService.getById(db, id, session.user.id);
  } catch (err) {
    redirect(ROUTES.DASHBOARD);
  }

  const isLapsed =
    !workspace.subscription ||
    (workspace.subscription.status !== "ACTIVE" &&
      workspace.subscription.status !== "TRIAL");

  return (
    <>
      {isLapsed && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Lapsed</AlertTitle>
            <AlertDescription>
              Your workspace subscription has ended. The workspace is currently in read-only mode.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
}
