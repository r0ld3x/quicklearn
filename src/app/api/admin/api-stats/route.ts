import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";

const DEEPSEEK_PLATFORM_URL = "https://platform.deepseek.com";

export async function GET() {
  try {
    await requireAdmin();

    const deepseekConfigured = Boolean(
      process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim().length > 0
    );

    return NextResponse.json({
      deepseekConfigured,
      deepseekPlatformUrl: DEEPSEEK_PLATFORM_URL,
      note: "Usage, balance, and billing are managed in the DeepSeek platform. Use the link below to view your API stats.",
    });
  } catch (error) {
    return apiError("[ADMIN_API_STATS]", error, "Failed to fetch API stats");
  }
}
