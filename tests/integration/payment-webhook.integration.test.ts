import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn((text: string) => text.replace("encrypted:", "")),
}));

vi.mock("@/lib/telegram", () => ({
  sendMessage: vi.fn(),
}));

vi.mock("@/lib/liqpay", () => ({
  verifySignature: vi.fn(),
  parseCallbackData: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    coursePurchase: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    botSubscriber: {
      findFirst: vi.fn(),
    },
    bot: {
      findUnique: vi.fn(),
    },
    endUser: {
      findUnique: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
  },
}));

// We mock inngest.send but keep the rest
vi.mock("@/lib/inngest", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    inngest: {
      ...actual.inngest,
      send: vi.fn(),
    },
  };
});

import { POST } from "@/app/api/webhooks/liqpay/route";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { PaymentService } from "@/modules/payment/service";

describe("Payment & Delivery Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LiqPay Webhook Route", () => {
    it("should trigger inngest event on successful new payment", async () => {
      vi.spyOn(PaymentService, "processPurchaseWebhook").mockResolvedValue({
        purchase: {
          id: "purchase-123",
          endUserId: "user-123",
          courseId: "course-123",
        } as any,
        isNewPayment: true,
      });

      (db.botSubscriber.findFirst as any).mockResolvedValue({
        botId: "bot-123",
        endUserId: "user-123",
        status: "ACTIVE",
      });

      const formData = new FormData();
      formData.append("data", "some-data");
      formData.append("signature", "some-signature");

      const request = new Request("http://localhost/api/webhooks/liqpay", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(200);

      expect(inngest.send).toHaveBeenCalledWith({
        name: "payment.success",
        data: {
          botId: "bot-123",
          endUserId: "user-123",
          courseId: "course-123",
          purchaseId: "purchase-123",
        },
      });
    });
  });
});
