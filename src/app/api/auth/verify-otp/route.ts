import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getOtp,
  deleteOtp,
  incrementOtpAttempts,
  getOtpAttempts,
} from "@/lib/redis";
import { createToken } from "@/lib/auth";

const MAX_OTP_ATTEMPTS = 5;

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  name: z.string().min(1).max(100).optional(),
});

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

    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code, name } = parsed.data;

    const attempts = await getOtpAttempts(email);
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await deleteOtp(email);
      return NextResponse.json(
        {
          error:
            "Too many failed attempts. Please request a new verification code.",
        },
        { status: 429 }
      );
    }

    const storedOtp = await getOtp(email);
    if (!storedOtp) {
      return NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 410 }
      );
    }

    if (storedOtp !== code) {
      await incrementOtpAttempts(email);
      const remaining = MAX_OTP_ATTEMPTS - attempts - 1;
      return NextResponse.json(
        {
          error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        },
        { status: 400 }
      );
    }

    await deleteOtp(email);

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for new accounts" },
          { status: 400 }
        );
      }

      const isFirstUser = (await db.user.count()) === 0;

      user = await db.user.create({
        data: {
          email,
          name,
          emailVerified: true,
          role: isFirstUser ? "ADMIN" : "USER",
        },
      });
    } else if (!user.emailVerified) {
      user = await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await db.session.create({
      data: { userId: user.id, token, expiresAt },
    });

    const cookieStore = await cookies();
    cookieStore.set("quicklearn-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error("[VERIFY_OTP]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
