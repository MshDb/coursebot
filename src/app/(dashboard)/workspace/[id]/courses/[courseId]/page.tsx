import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CourseForm } from "@/components/courses/course-form";
import { CourseLinkManager } from "@/components/courses/course-link-manager";
import { BotLinkManager } from "@/components/courses/bot-link-manager";
import { CourseActions } from "@/components/courses/course-actions";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}) {
  const { id, courseId } = await params;

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/workspace/${id}/courses`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Course</h1>
        </div>
        <CourseActions workspaceId={id} courseId={courseId} />
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Course Details</h2>
          <CourseForm workspaceId={id} courseId={courseId} />
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground tracking-tight flex items-center gap-2">External Links</h2>
          <p className="text-sm text-muted-foreground mb-4">Links to lessons or materials that buyers get access to.</p>
          <CourseLinkManager workspaceId={id} courseId={courseId} />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground tracking-tight">Linked Bots</h2>
          <p className="text-sm text-muted-foreground mb-4">Connect this course to bots where it can be purchased.</p>
          <BotLinkManager workspaceId={id} courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
