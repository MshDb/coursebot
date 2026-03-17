import type { EndUser } from "@prisma/client";

/**
 * EndUser with subscription info (for cross-module queries).
 */
export interface EndUserWithSubscriptions extends EndUser {
  subscriptions: Array<{
    botId: string;
    status: string;
  }>;
}
