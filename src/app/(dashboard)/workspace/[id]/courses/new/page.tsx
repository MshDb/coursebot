import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CourseForm } from "@/components/courses/course-form";

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center space-x-4">
        <Link href={`/workspace/${id}/courses`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Course</h1>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <CourseForm workspaceId={id} />
      </div>
    </div>
  );
}
