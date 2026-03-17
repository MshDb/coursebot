"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCourseSchema, type CreateCourseInput } from "@/modules/course/schema";
import { api } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseFormProps {
  workspaceId: string;
  courseId?: string;
}

export function CourseForm({ workspaceId, courseId }: CourseFormProps) {
  const router = useRouter();
  
  const ctx = api.useUtils();
  const isEditing = !!courseId;

  const { data: course, isLoading } = api.course.getById.useQuery(
    { workspaceId, id: courseId! },
    { enabled: isEditing }
  );

  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema) as any,
    defaultValues: {
      name: course?.name || "",
      description: course?.description || "",
      price: course?.price ? Number(course.price) : 0,
    },
    values: course ? {
      name: course.name,
      description: course.description || "",
      price: Number(course.price),
    } : undefined,
  });

  const createStatus = api.course.create.useMutation({
    onSuccess: (data) => {
      toast.success("Course created successfully");
      ctx.course.list.invalidate({ workspaceId });
      router.push(`/workspace/${workspaceId}/courses/${data.id}`);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const updateStatus = api.course.update.useMutation({
    onSuccess: () => {
      toast.success("Course updated successfully");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
      ctx.course.list.invalidate({ workspaceId });
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const onSubmit = (data: CreateCourseInput) => {
    if (isEditing) {
      updateStatus.mutate({ ...data, workspaceId, id: courseId! });
    } else {
      createStatus.mutate({ ...data, workspaceId });
    }
  };

  const isPending = createStatus.isPending || updateStatus.isPending;

  if (isEditing && isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Masterclass 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="What will they learn?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (UAH)</FormLabel>
              <FormDescription>Set to 0 for a free course.</FormDescription>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" 
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
