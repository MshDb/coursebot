import type { PrismaClient } from "@prisma/client";
import type { CreatePurchaseInput, CheckAccessInput } from "./schema";
import { generatePaymentUrl, verifySignature, parseCallbackData } from "@/lib/liqpay";
import { env } from "@/env";

export const PaymentService = {
  async createPurchase(db: PrismaClient, input: CreatePurchaseInput) {
    // Basic idempotency if they already clicked buy before, but we might just overwrite or create new.
    // The spec notes: "Concurrent purchase attempts: CoursePurchase UNIQUE(end_user_id, course_id) prevents duplicates."
    // Prisma upsert might be better or handle error. We use upsert to cleanly handle.
    const purchase = await db.coursePurchase.upsert({
      where: {
        // liqpayOrderId is exactly what we use as purchase.id or custom ID that is generated. Wait, the id is randomUUID.
        liqpayOrderId: input.endUserId + "___" + input.courseId,
      },
      update: {
        amountPaid: input.amount,
      },
      create: {
        endUserId: input.endUserId,
        courseId: input.courseId,
        amountPaid: input.amount,
        liqpayOrderId: input.endUserId + "___" + input.courseId, // acts as unique combo if not generating UUID for it
      },
    });

    const paymentUrl = generatePaymentUrl({
      version: 3,
      public_key: env.LIQPAY_PUBLIC_KEY,
      action: "pay",
      amount: input.amount,
      currency: "UAH",
      description: `Course Purchase ${input.courseId}`,
      order_id: purchase.liqpayOrderId,
      server_url: `${env.WEBHOOK_BASE_URL}/api/webhooks/liqpay`,
    }, env.LIQPAY_PRIVATE_KEY);

    return { purchaseId: purchase.id, paymentUrl };
  },

  async processPurchaseWebhook(db: PrismaClient, data: string, signature: string) {
    const isValid = verifySignature(data, signature, env.LIQPAY_PRIVATE_KEY);
    if (!isValid) throw new Error("Invalid signature");

    const callback = parseCallbackData(data);
    const purchase = await db.coursePurchase.findUnique({
      where: { liqpayOrderId: callback.order_id },
    });

    if (!purchase) throw new Error("Purchase not found");
    // If liqpayPaymentId is already set, it means we already processed this successful payment
    if (purchase.liqpayPaymentId) {
      return { purchase, isNewPayment: false };
    }

    if (callback.status === "success" || callback.status === "sandbox") {
      const updated = await db.coursePurchase.update({
        where: { id: purchase.id },
        data: {
          liqpayPaymentId: callback.payment_id?.toString() || callback.transaction_id.toString(),
        },
      });
      return { purchase: updated, isNewPayment: true };
    }

    return { purchase, isNewPayment: false };
  },

  async checkAccess(db: PrismaClient, endUserId: string, input: CheckAccessInput) {
    const access = await db.coursePurchase.findFirst({
      where: {
        endUserId,
        courseId: input.courseId,
        liqpayPaymentId: { not: null }, // completed purchases have liqpayPaymentId
      },
    });

    return !!access;
  },

  async grantAccess(db: PrismaClient, purchaseId: string) {
    return db.coursePurchase.update({
      where: { id: purchaseId },
      data: {
        liqpayPaymentId: "manual_grant_" + Date.now().toString(),
      },
    });
  }
};

