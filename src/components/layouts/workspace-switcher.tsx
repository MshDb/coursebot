"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/client";
import { ROUTES } from "@/lib/constants";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const params = useParams();
  const currentWorkspaceId = params?.id as string | undefined;

  const { data: workspaces, isLoading } = api.workspace.list.useQuery();

  const currentWorkspace = workspaces?.find((w: any) => w.id === currentWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
      >
        <span className="truncate">
          {isLoading ? "Loading workspaces..." : currentWorkspace?.name || "Select Workspace"}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces?.map((workspace: any) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => {
              if (workspace.id !== currentWorkspaceId) {
                router.push(ROUTES.WORKSPACE(workspace.id));
              }
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="truncate">{workspace.name}</span>
            {workspace.id === currentWorkspaceId && (
              <Check className="h-4 w-4 ml-2 opacity-100" />
            )}
          </DropdownMenuItem>
        ))}
        {workspaces?.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No workspaces found
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-muted-foreground"
          onClick={() => router.push(ROUTES.DASHBOARD)}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
