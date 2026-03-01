import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        plan: user.plan,
        credits: user.credits,
        totalCreditsUsed: user.totalCreditsUsed,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[AUTH_ME]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updates: { name?: string; image?: string | null } = {};

    if (typeof body.name === "string") {
      const trimmed = body.name.trim();
      if (trimmed.length > 0 && trimmed.length <= 100) {
        updates.name = trimmed;
      }
    }

    if (typeof body.image === "string" || body.image === null) {
      updates.image = body.image;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        image: updated.image,
        role: updated.role,
        plan: updated.plan,
        credits: updated.credits,
        totalCreditsUsed: updated.totalCreditsUsed,
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("[AUTH_ME_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await db.user.delete({ where: { id: user.id } });

    const cookieStore = await cookies();
    cookieStore.delete("quicklearn-session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AUTH_ME_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
