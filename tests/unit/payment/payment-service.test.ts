import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "@/modules/payment/service";
import * as liqpay from "@/lib/liqpay";

vi.mock("@/lib/liqpay");
vi.mock("@/env", () => ({
  env: {
    LIQPAY_PRIVATE_KEY: "private-key",
  },
}));

// Create a mock PrismaClient
function createMockDb() {
  return {
    coursePurchase: {
      create: vi.fn(),
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    }
  } as unknown as Parameters<typeof PaymentService.createPurchase>[0];
}

describe("PaymentService", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    vi.clearAllMocks();
  });

  describe("createPurchase", () => {
    it("should create a pending purchase and generate payment URL", async () => {
      (db.coursePurchase.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "purchase1", liqpayOrderId: "user1___course1" });
      vi.mocked(liqpay.generatePaymentUrl).mockReturnValue("https://liqpay.com/pay");

      const result = await PaymentService.createPurchase(db, {
        endUserId: "user1",
        courseId: "course1",
        amount: 100,
      });

      expect(db.coursePurchase.upsert).toHaveBeenCalledWith({
        where: { liqpayOrderId: "user1___course1" },
        update: expect.any(Object),
        create: expect.any(Object),
      });
      expect(liqpay.generatePaymentUrl).toHaveBeenCalled();
      expect(result).toEqual({ purchaseId: "purchase1", paymentUrl: "https://liqpay.com/pay" });
    });
  });

  describe("processWebhook", () => {
    it("should verify signature and process success payment", async () => {
      vi.mocked(liqpay.verifySignature).mockReturnValue(true);
      vi.mocked(liqpay.parseCallbackData).mockReturnValue({
        status: "success",
        order_id: "purchase1",
        transaction_id: 123,
      } as any);
      (db.coursePurchase.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "purchase1", liqpayPaymentId: null });
      (db.coursePurchase.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "purchase1", liqpayPaymentId: "txn_123" });

      const result = await PaymentService.processPurchaseWebhook(db, "data-base64", "signature-base64");
      
      expect(result.purchase.liqpayPaymentId).toBe("txn_123");
      expect(result.isNewPayment).toBe(true);
      expect(db.coursePurchase.update).toHaveBeenCalledWith({
        where: { id: "purchase1" },
        data: { liqpayPaymentId: expect.any(String) },
      });
    });

    it("should reject invalid signatures", async () => {
      vi.mocked(liqpay.verifySignature).mockReturnValue(false);

      await expect(
        PaymentService.processPurchaseWebhook(db, "data", "bad")
      ).rejects.toThrow("Invalid signature");
    });
  });
});
