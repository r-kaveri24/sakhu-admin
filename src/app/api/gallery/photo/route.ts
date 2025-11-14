import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";
import s3Client, { S3_BUCKET } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3KeyFromUrl } from "@/lib/uploadClient";
import { jsonWithCors, optionsWithCors } from "@/lib/cors";

// GET /api/gallery/photo - list gallery photos
export async function GET() {
  const items = await prisma.mediaImage.findMany({
    where: { key: { startsWith: "gallery/photos/" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, url: true, width: true, height: true, caption: true, createdAt: true },
  });
  return jsonWithCors({ items });
}

// OPTIONS for CORS preflight
export function OPTIONS() {
  return optionsWithCors();
}

// POST /api/gallery/photo - create gallery photo
export const POST = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const key = (body?.key || "").trim();
    const url = (body?.url || "").trim();
    const caption = (body?.caption || undefined) as string | undefined;
    const width = (body?.width as number | undefined) ?? undefined;
    const height = (body?.height as number | undefined) ?? undefined;
    if (!key || !url) return NextResponse.json({ error: "key and url are required" }, { status: 400 });

    const item = await prisma.mediaImage.create({
      data: { key, url, width, height, caption, createdBy: request.user?.userId, galleryId: "gallery_photo" },
      select: { id: true, key: true, url: true, width: true, height: true, caption: true, createdAt: true },
    });
    return jsonWithCors(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/gallery/photo error", e);
    return jsonWithCors({ error: "Failed to create gallery photo" }, { status: 500 });
  }
});

// PUT /api/gallery/photo?id=UUID - update caption or url
export const PUT = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const body = await request.json();
    const data: any = {};
    if (typeof body?.caption === "string" || body?.caption == null) data.caption = body?.caption ?? null;
    if (typeof body?.url === "string") data.url = body.url;
    if (typeof body?.key === "string") data.key = body.key;

    const item = await prisma.mediaImage.update({
      where: { id },
      data,
      select: { id: true, key: true, url: true, width: true, height: true, caption: true, createdAt: true },
    });
    return jsonWithCors(item);
  } catch (e) {
    console.error("PUT /api/gallery/photo error", e);
    return jsonWithCors({ error: "Failed to update gallery photo" }, { status: 500 });
  }
});

// DELETE /api/gallery/photo?id=UUID - delete photo and S3 object
export const DELETE = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.mediaImage.findUnique({ where: { id }, select: { url: true } });
    await prisma.mediaImage.delete({ where: { id } });

    const key = existing?.url ? s3KeyFromUrl(existing.url) : null;
    if (key) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      } catch (err) {
        console.warn("Failed to delete photo from S3", err);
      }
    }

    return jsonWithCors({ ok: true });
  } catch (e) {
    console.error("DELETE /api/gallery/photo error", e);
    return jsonWithCors({ error: "Failed to delete gallery photo" }, { status: 500 });
  }
});