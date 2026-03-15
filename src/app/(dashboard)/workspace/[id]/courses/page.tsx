import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  return (
    <div className="flex flex-col h-full mt-8">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center bg-card">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Courses</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          Create and manage courses to distribute to your subscribers. (Coming in Spec 4)
        </p>
      </div>
    </div>
  );
}
