"use client";

import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle2, ArchiveX, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { useState } from "react";

export function CourseActions({ workspaceId, courseId }: { workspaceId: string; courseId: string; }) {
  const ctx = api.useUtils();
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { data: course, isLoading } = api.course.getById.useQuery({ workspaceId, id: courseId });

  const publishMut = api.course.publish.useMutation({
    onSuccess: () => {
      toast.success("Course published");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
      ctx.course.list.invalidate({ workspaceId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const archiveMut = api.course.archive.useMutation({
    onSuccess: () => {
      toast.success("Course archived");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
      ctx.course.list.invalidate({ workspaceId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const deleteMut = api.course.delete.useMutation({
    onSuccess: () => {
      toast.success("Course deleted");
      ctx.course.list.invalidate({ workspaceId });
      router.push(`/workspace/${workspaceId}/courses`);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  if (isLoading || !course) return null;

  return (
    <div className="flex items-center gap-4">
      <Badge variant={course.status === "PUBLISHED" ? "default" : course.status === "ARCHIVED" ? "destructive" : "secondary"} className="text-[11px] uppercase tracking-wider">
        {course.status}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "cursor-pointer" })}>
          Actions <ChevronDown className="h-4 w-4 ml-2" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {course.status !== "PUBLISHED" && (
            <DropdownMenuItem onClick={() => publishMut.mutate({ workspaceId, id: courseId })} disabled={publishMut.isPending} className="cursor-pointer">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Publish
            </DropdownMenuItem>
          )}
          {course.status !== "ARCHIVED" && (
            <DropdownMenuItem onClick={() => archiveMut.mutate({ workspaceId, id: courseId })} disabled={archiveMut.isPending} className="cursor-pointer">
              <ArchiveX className="h-4 w-4 mr-2" /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => setIsAlertOpen(true)} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will soft-delete the course. It will no longer appear in the bot or dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMut.mutate({ workspaceId, id: courseId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
