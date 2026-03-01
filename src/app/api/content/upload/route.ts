import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkContentTypeAllowed, checkCredits } from "@/lib/credits";

const utapi = new UTApi();

const MAX_PDF_SIZE = 16 * 1024 * 1024;
const MAX_AUDIO_SIZE = 64 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const title = (formData.get("title") as string | null)?.trim();

    if (!file || !type) {
      return NextResponse.json(
        { error: "Missing file or type" },
        { status: 400 }
      );
    }

    if (type !== "PDF") {
      return NextResponse.json(
        { error: "Only PDF uploads are supported. Audio is temporarily disabled." },
        { status: 400 }
      );
    }

    if (!checkContentTypeAllowed(user.plan, type)) {
      return NextResponse.json(
        {
          error: `Your ${user.plan} plan does not support ${type} content. Please upgrade.`,
        },
        { status: 403 }
      );
    }

    const creditCheck = await checkCredits(user.id, user.plan);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 429 }
      );
    }

    const maxSize = type === "PDF" ? MAX_PDF_SIZE : MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            type === "PDF"
              ? "File too large (max 16MB)"
              : "File too large (max 64MB)",
        },
        { status: 400 }
      );
    }

    const uploadResult = await utapi.uploadFiles([file]);

    const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
    const data = result?.data ?? null;
    const err = result?.error;

    if (err || !data?.key || !data?.url) {
      console.error("[CONTENT_UPLOAD]", err);
      return NextResponse.json(
        { error: err?.message ?? "Upload failed" },
        { status: 500 }
      );
    }

    const finalTitle =
      title ||
      (file.name ? file.name.replace(/\.[^/.]+$/, "") : undefined) ||
      `${type} content`;

    const content = await db.content.create({
      data: {
        userId: user.id,
        type,
        title: finalTitle.slice(0, 255),
        fileUrl: data.url,
        fileKey: data.key,
        originalFilename: file.name,
        status: "PROCESSING",
      },
    });

    return NextResponse.json(
      {
        id: content.id,
        type: content.type,
        title: content.title,
        description: content.description,
        status: content.status,
        createdAt: content.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CONTENT_UPLOAD]", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
