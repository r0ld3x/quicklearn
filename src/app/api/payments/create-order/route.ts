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

    const body = await req.json();
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
    console.error("[PAYMENT_CREATE_ORDER]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    const status = message.includes("required") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
