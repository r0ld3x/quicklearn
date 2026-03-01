import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { setOtp } from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

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
