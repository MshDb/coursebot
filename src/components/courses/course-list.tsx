"use client";

import { api } from "@/trpc/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Edit2, BookOpen } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseListProps {
  workspaceId: string;
}

export function CourseList({ workspaceId }: CourseListProps) {
  const { data: courses, isLoading } = api.course.list.useQuery({ workspaceId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!courses?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No courses found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          Get started by creating your first course.
        </p>
        <Link href={`/workspace/${workspaceId}/courses/new`} className={buttonVariants({ variant: "default" })}>Create Course</Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price (UAH)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bots</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell>{Number(course.price).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
                  {course.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>{course._count.botLinks}</TableCell>
              <TableCell className="text-right">
                <Link href={`/workspace/${workspaceId}/courses/${course.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
