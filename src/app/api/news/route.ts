import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";
import s3Client, { S3_BUCKET } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ items });
}

// POST /api/news - Create news (expects JSON and optional heroImageUrl)
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { title, slug, summary, content, heroImageUrl, isPublished = false } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const created = await prisma.news.create({
      data: {
        title,
        slug: finalSlug,
        summary,
        content,
        heroImage: heroImageUrl,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        heroImage: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
  }
}

export const POST = requireEditor(postHandler);

// PUT /api/news - Update news by id
async function putHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { id, title, slug, summary, content, heroImageUrl, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        content,
        heroImage: heroImageUrl,
        isPublished,
        publishedAt: typeof isPublished === "boolean" ? (isPublished ? new Date() : null) : undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        content: true,
        heroImage: true,
        isPublished: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating news:", error);
    return NextResponse.json({ error: "Failed to update news" }, { status: 500 });
  }
}

export const PUT = requireEditor(putHandler);

// DELETE /api/news?id=UUID&heroImageKey=key - Delete news and optional S3 hero image
async function deleteHandler(request: AuthenticatedRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const heroImageKey = request.nextUrl.searchParams.get("heroImageKey");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await prisma.news.delete({ where: { id } });

    if (heroImageKey) {
      try {
        const cmd = new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: heroImageKey });
        await s3Client.send(cmd);
      } catch (e) {
        console.warn("S3 delete failed:", e);
      }
    }

    return NextResponse.json({ message: "Item deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
  }
}

export const DELETE = requireEditor(deleteHandler);