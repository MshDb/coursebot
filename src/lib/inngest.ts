// @ts-nocheck
import { Inngest } from "inngest";
import { db } from "./db";
import { decrypt } from "./encryption";
import { sendMessage } from "./telegram";

export const inngest = new Inngest({ id: "coursebot" });

export const processPaymentSuccess = inngest.createFunction(
  { 
    id: "process-payment-success", 
    name: "Process Payment Success",
    trigger: { event: "payment.success" }
  } as any,
  async ({ event, step }: any) => {
    if (!event?.data) return { success: false };
    const { botId, endUserId, courseId } = event.data;

    await step.run("send-course-links", async () => {
      // 1. Get entities
      const bot = await db.bot.findUnique({ where: { id: botId } });
      const endUser = await db.endUser.findUnique({ where: { id: endUserId } });
      const course = await db.course.findUnique({ 
        where: { id: courseId },
        include: { externalLinks: { orderBy: { order: "asc" } } }
      });

      if (!bot || !endUser || !course) {
        throw new Error("Missing entities for sending links");
      }

      if (bot.deletedAt || course.deletedAt) {
        return; // soft-deleted, do not send
      }

      const token = decrypt(bot.tokenEncrypted);
      
      let messageText = `🎉 <b>Payment Successful!</b>\n\nYou now have access to <b>${course.name}</b>.\n\n`;
      
      if (course.externalLinks.length === 0) {
        messageText += "<i>No links available yet. The creator will add them soon.</i>";
      } else {
        messageText += "<b>Here are your links:</b>\n\n";
        course.externalLinks.forEach((link: any) => {
          messageText += `🔗 <a href="${link.url}">${link.title || link.url}</a>\n`;
        });
      }

      await sendMessage(token, Number(endUser.telegramUserId), messageText, { parse_mode: "HTML" });
    });

    return { success: true };
  }
);
