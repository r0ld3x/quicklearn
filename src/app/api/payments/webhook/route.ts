import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event as string;

    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        if (!payment) break;

        const subscription = await db.subscription.findFirst({
          where: { razorpayPaymentId: payment.id },
        });

        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE" },
          });
        }
        break;
      }

      case "subscription.activated": {
        const sub = event.payload?.subscription?.entity;
        if (!sub) break;

        const existing = await db.subscription.findFirst({
          where: { razorpaySubscriptionId: sub.id },
        });

        if (existing) {
          await db.$transaction([
            db.subscription.update({
              where: { id: existing.id },
              data: { status: "ACTIVE" },
            }),
            db.user.update({
              where: { id: existing.userId },
              data: { plan: existing.plan },
            }),
          ]);
        }
        break;
      }

      case "payment.failed": {
        const failedPayment = event.payload?.payment?.entity;
        if (!failedPayment) break;

        const failedSub = await db.subscription.findFirst({
          where: { razorpayPaymentId: failedPayment.id },
        });

        if (failedSub) {
          await db.subscription.update({
            where: { id: failedSub.id },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
