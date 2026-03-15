"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/modules/workspace/schema";
import { api } from "@/trpc/client";
import { ROUTES } from "@/lib/constants";

interface CreateWorkspaceDialogProps {
  children?: React.ReactElement;
  onSuccess?: (workspaceId: string) => void;
}

export function CreateWorkspaceDialog({ children, onSuccess }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: (data: { id: string }) => {
      toast.success("Workspace created successfully");
      setOpen(false);
      form.reset();
      utils.workspace.list.invalidate();
      
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        router.push(ROUTES.WORKSPACE(data.id));
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create workspace");
    },
  });

  const onSubmit = (data: CreateWorkspaceInput) => {
    createWorkspace.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          children || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to manage your bots, courses, and subscribers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createWorkspace.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createWorkspace.isPending}>
                {createWorkspace.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
