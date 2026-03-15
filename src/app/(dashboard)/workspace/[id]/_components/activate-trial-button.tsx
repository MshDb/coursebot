"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/client";

export function ActivateTrialButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const activateTrial = api.workspace.activateTrial.useMutation({
    onSuccess: () => {
      toast.success("Free trial activated successfully");
      utils.workspace.getById.invalidate({ workspaceId });
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate trial");
    },
  });

  return (
    <Button 
      onClick={() => activateTrial.mutate({ workspaceId })}
      disabled={activateTrial.isPending}
    >
      {activateTrial.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Start Free Trial
    </Button>
  );
}
