import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client, { S3_BUCKET } from "@/lib/s3";
import { jsonWithCors, optionsWithCors } from "@/lib/cors";

// GET /api/testimonials - List testimonials from PostgreSQL
export async function GET() {
  const items = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      role: true,
      quote: true,
      rating: true,
      avatar: true,
      order: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return jsonWithCors({ items });
}

// POST /api/testimonials - Create testimonial (expects JSON, image uploaded via presigned URL)
async function createHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { name, role, quote, avatarUrl, rating, isActive = true, order = 0 } = body;

    if (!name || !quote) {
      return NextResponse.json({ error: "Name and quote are required" }, { status: 400 });
    }

    const created = await prisma.testimonial.create({
      data: {
        name,
        role,
        quote,
        rating: typeof rating === "number" ? rating : 5,
        avatar: avatarUrl,
        isActive,
        order,
      },
      select: {
        id: true,
        name: true,
        role: true,
        quote: true,
        rating: true,
        avatar: true,
        order: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}

export const POST = requireEditor(createHandler);

// DELETE /api/testimonials?id=UUID - Delete testimonial and optional S3 image
async function deleteHandler(request: AuthenticatedRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const imageKey = request.nextUrl.searchParams.get("imageKey");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    // Delete DB record
    await prisma.testimonial.delete({ where: { id } });

    // Optionally delete S3 object if key provided
    if (imageKey) {
      try {
        const cmd = new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: imageKey });
        await s3Client.send(cmd);
      } catch (e) {
        console.warn("S3 delete failed:", e);
      }
    }

    return NextResponse.json({ message: "Item deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}

export const DELETE = requireEditor(deleteHandler);

// CORS preflight for website origin
export function OPTIONS() {
  return optionsWithCors();
}