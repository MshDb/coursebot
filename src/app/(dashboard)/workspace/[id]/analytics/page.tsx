import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full mt-8">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center bg-card">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Analytics</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          Dive deep into engagement metrics and sales performance. (Coming in Spec 6)
        </p>
      </div>
    </div>
  );
}
