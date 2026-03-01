import Razorpay from "razorpay";
import crypto from "crypto";

function createRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export const razorpay = createRazorpayClient();

export const PLANS = {
  FREE: {
    name: "Free",
    creditsPerDay: 5,
    monthly: 0,
    yearly: 0,
    features: [
      "5 credits per day",
      "PDF & link processing",
      "Basic summaries",
      "Flashcard generation",
    ],
  },
  PRO: {
    name: "Pro",
    creditsPerDay: 50,
    monthly: 499,
    yearly: 4999,
    features: [
      "50 credits per day",
      "All content types",
      "Detailed summaries",
      "Flashcards & Q&A",
      "Chat with content",
      "Priority processing",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    creditsPerDay: Infinity,
    monthly: 999,
    yearly: 9999,
    features: [
      "Unlimited credits",
      "All content types",
      "Advanced summaries",
      "Flashcards & Q&A",
      "Chat with content",
      "Priority processing",
      "API access",
      "Dedicated support",
    ],
  },
} as const;

export async function createOrder(
  amount: number,
  currency: string = "INR",
  receipt: string
) {
  if (!razorpay) throw new Error("Razorpay not configured");
  return razorpay.orders.create({
    amount: amount * 100,
    currency,
    receipt,
  });
}

export function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}
