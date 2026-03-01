import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { createOrder, PLANS } from "@/lib/razorpay";
import { v4 as uuid } from "uuid";

const createOrderSchema = z.object({
  planId: z.enum(["PRO", "ENTERPRISE"]),
  period: z.enum(["monthly", "yearly"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { planId, period } = parsed.data;
    const plan = PLANS[planId];
    const amount = plan[period];

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Invalid plan selection" },
        { status: 400 }
      );
    }

    const receipt = `rcpt_${uuid().replace(/-/g, "").slice(0, 20)}`;
    const order = await createOrder(amount, "INR", receipt);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId,
      period,
      planName: plan.name,
      userId: user.id,
    });
  } catch (error) {
    const { apiError } = await import("@/lib/api-utils");
    return apiError("[PAYMENT_CREATE_ORDER]", error, "Failed to create order");
  }
}
