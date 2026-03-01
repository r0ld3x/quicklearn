import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { setOtp, checkOtpSendLimit } from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const rateCheck = await checkOtpSendLimit(email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up first." },
        { status: 404 }
      );
    }

    const code = generateOtp();
    await setOtp(email, code);
    await sendOtpEmail(email, code);

    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("[LOGIN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
