import { serve } from "inngest/next";
import { inngest, processPaymentSuccess } from "@/lib/inngest";

// Expose the API to Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPaymentSuccess
  ],
});
