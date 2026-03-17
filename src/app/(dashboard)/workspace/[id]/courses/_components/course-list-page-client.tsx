"use client";

import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { CourseList } from "@/components/courses/course-list";
import Link from "next/link";

interface CourseListPageClientProps {
  workspaceId: string;
}

export default function CourseListPageClient({ workspaceId }: CourseListPageClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your courses and learning products.
          </p>
        </div>
        <Link href={`/workspace/${workspaceId}/courses/new`} className={buttonVariants({ variant: "default" })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Link>
      </div>
      <CourseList workspaceId={workspaceId} />
    </div>
  );
}
