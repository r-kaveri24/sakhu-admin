import { NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";
import s3Client, { S3_BUCKET } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3KeyFromUrl } from "@/lib/uploadClient";

// GET /api/news - List news from PostgreSQL
export async function GET() {
  const items = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      content: true,
      heroImage: true,
      isPublished: true,
      publishedAt: true,
      publishedDay: true,
      publishedMonth: true,
      publishedYear: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return jsonWithCors({ items });
}

// Preflight support
export function OPTIONS() {
  return optionsWithCors();
}

// DELETE /api/news?id=... - Delete a news item and its hero image from S3
export const DELETE = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await prisma.news.findUnique({
      where: { id },
      select: { heroImage: true },
    });

    // Delete the DB record first
    await prisma.news.delete({ where: { id } });

    // Then attempt to delete hero image from S3 if present
    const heroUrl = existing?.heroImage || null;
    const key = heroUrl ? s3KeyFromUrl(heroUrl) : null;
    if (key) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      } catch (err) {
        // If S3 deletion fails, we still return success for the DB deletion
        console.error("Failed to delete hero image from S3", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/news error", error);
    return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
  }
});