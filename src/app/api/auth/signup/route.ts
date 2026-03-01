import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { setOtp, checkOtpSendLimit } from "@/lib/redis";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100),
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

    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, name } = parsed.data;

    const rateCheck = await checkOtpSendLimit(email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    const code = generateOtp();
    await setOtp(email, code);
    await sendOtpEmail(email, code);

    return NextResponse.json({
      message: "Verification code sent",
      name,
    });
  } catch (error) {
    console.error("[SIGNUP]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
