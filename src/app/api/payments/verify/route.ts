import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { verifyPayment, PLANS } from "@/lib/razorpay";
import { db } from "@/lib/db";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  planId: z.enum(["PRO", "ENTERPRISE"]),
  period: z.enum(["monthly", "yearly"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      period,
    } = parsed.data;

    const isValid = verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    const amount = plan[period];
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + (period === "yearly" ? 12 : 1));

    const [updatedUser, subscription] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          plan: planId,
          credits: plan.creditsPerDay,
        },
      }),
      db.subscription.create({
        data: {
          userId: user.id,
          plan: planId,
          status: "ACTIVE",
          razorpaySubscriptionId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount,
          currency: "INR",
          startDate: now,
          endDate,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        plan: updatedUser.plan,
        credits: updatedUser.credits,
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error("[PAYMENT_VERIFY]", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    const status = message.includes("required") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
