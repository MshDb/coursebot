"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateWorkspaceSchema, type UpdateWorkspaceInput } from "@/modules/workspace/schema";
import { ROUTES } from "@/lib/constants";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const router = useRouter();
  const utils = api.useUtils();

  const { data: workspace, isLoading } = api.workspace.getById.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  const form = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      workspaceId: workspaceId || "",
      name: "",
    },
  });

  useEffect(() => {
    if (workspace) {
      form.reset({
        workspaceId: workspace.id,
        name: workspace.name,
      });
    }
  }, [workspace, form]);

  const updateMutation = api.workspace.update.useMutation({
    onSuccess: () => {
      toast.success("Workspace updated successfully");
      utils.workspace.getById.invalidate({ workspaceId });
      utils.workspace.list.invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update workspace");
    },
  });

  const deleteMutation = api.workspace.delete.useMutation({
    onSuccess: () => {
      toast.success("Workspace deleted");
      utils.workspace.list.invalidate();
      router.push(ROUTES.DASHBOARD);
    },
    onError: (err: any) => {
      toast.error(err.message || "Cannot delete workspace");
    },
  });

  const onSubmit = (data: UpdateWorkspaceInput) => {
    updateMutation.mutate(data);
  };

  if (isLoading || !workspace) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canDelete = !workspace.subscription || 
    (workspace.subscription.status !== "ACTIVE" && workspace.subscription.status !== "TRIAL");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your workspace preferences and billing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Name</CardTitle>
          <CardDescription>
            This is your workspace's visible name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversibly delete this workspace and all its data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the workspace
                  and remove related data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    if (canDelete) {
                      deleteMutation.mutate({ workspaceId });
                    } else {
                      toast.error("You must cancel your active subscription before deleting the workspace.");
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Workspace"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
