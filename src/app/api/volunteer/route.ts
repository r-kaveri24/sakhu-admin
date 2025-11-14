import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";
import s3Client, { S3_BUCKET } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3KeyFromUrl } from "@/lib/uploadClient";
import { jsonWithCors, optionsWithCors } from "@/lib/cors";

// GET /api/volunteer - list volunteer members
export async function GET() {
  const items = await prisma.volunteerMember.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, avatarUrl: true, createdAt: true },
  });
  return jsonWithCors({ items });
}

// Support CORS preflight
export function OPTIONS() {
  return optionsWithCors();
}

// POST /api/volunteer - create volunteer member
export const POST = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const name = (body?.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const avatarUrl = (body?.avatarUrl || undefined) as string | undefined;

    const item = await prisma.volunteerMember.create({
      data: { name, avatarUrl },
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/volunteer error", e);
    return NextResponse.json({ error: "Failed to create volunteer" }, { status: 500 });
  }
});

// PUT /api/volunteer?id=UUID - update volunteer member
export const PUT = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const body = await request.json();
    const data: any = {};
    if (typeof body?.name === "string") data.name = body.name.trim();
    if (typeof body?.avatarUrl === "string" || body?.avatarUrl == null) data.avatarUrl = body?.avatarUrl ?? null;

    const item = await prisma.volunteerMember.update({
      where: { id },
      data,
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PUT /api/volunteer error", e);
    return NextResponse.json({ error: "Failed to update volunteer" }, { status: 500 });
  }
});

// DELETE /api/volunteer?id=UUID - delete volunteer and its avatar from S3
export const DELETE = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.volunteerMember.findUnique({ where: { id }, select: { avatarUrl: true } });
    await prisma.volunteerMember.delete({ where: { id } });

    const key = existing?.avatarUrl ? s3KeyFromUrl(existing.avatarUrl) : null;
    if (key) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      } catch (err) {
        console.warn("Failed to delete avatar from S3", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/volunteer error", e);
    return NextResponse.json({ error: "Failed to delete volunteer" }, { status: 500 });
  }
});