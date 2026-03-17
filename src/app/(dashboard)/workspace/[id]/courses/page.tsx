import CourseListPageClient from "./_components/course-list-page-client";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CourseListPageClient workspaceId={id} />;
}
