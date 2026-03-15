import { Send } from "lucide-react";

export default function PostsPage() {
  return (
    <div className="flex flex-col h-full mt-8">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center bg-card">
        <Send className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Posts</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          Send announcements, updates, and marketing messages. (Coming in Spec 5)
        </p>
      </div>
    </div>
  );
}
