import { Users } from "lucide-react";

export default function SubscribersPage() {
  return (
    <div className="flex flex-col h-full mt-8">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center bg-card">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Subscribers</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          View and analyze your user base from all your bots. (Coming in Spec 6)
        </p>
      </div>
    </div>
  );
}
