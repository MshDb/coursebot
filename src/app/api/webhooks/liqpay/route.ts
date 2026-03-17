import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentService } from "@/modules/payment/service";
import { inngest } from "@/lib/inngest";
import { SubscriberStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = formData.get("data") as string | null;
    const signature = formData.get("signature") as string | null;

    if (!data || !signature) {
      return NextResponse.json({ error: "Missing data or signature" }, { status: 400 });
    }

    const { purchase, isNewPayment } = await PaymentService.processPurchaseWebhook(db, data, signature);

    if (isNewPayment) {
      // Find the bot the user is subscribed to
      // Since a user might be subscribed to multiple bots, we just find any bot linked to the course they bought that they use, or just the first active one.
      const subscriber = await db.botSubscriber.findFirst({
        where: { endUserId: purchase.endUserId, status: SubscriberStatus.ACTIVE },
      });

      if (subscriber) {
        await inngest.send({
          name: "payment.success",
          data: {
            botId: subscriber.botId,
            endUserId: purchase.endUserId,
            courseId: purchase.courseId,
            purchaseId: purchase.id,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LiqPay Webhook] Error:", error);
    // Return 200 so LiqPay doesn't retry unnecessarily
    return NextResponse.json({ ok: true });
  }
}
