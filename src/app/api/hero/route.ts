import { NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";
import s3Client, { S3_BUCKET } from "@/lib/s3";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// GET /api/hero - List hero images from PostgreSQL (MediaImage with key prefix 'hero/')
export async function GET() {
  const items = await prisma.mediaImage.findMany({
    where: {
      key: { startsWith: "hero/" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      key: true,
      url: true,
      height: true,
      alt: true, // can be used for breakpoint: desktop/tablet/mobile
      caption: true,
      createdAt: true,
    },
  });
  return jsonWithCors({ items });
}

// Preflight support
export function OPTIONS() {
  return optionsWithCors();
}

// POST /api/hero - Create hero image (expects JSON with S3 publicUrl and key)
// Body: { key: string, url: string, breakpoint?: 'desktop'|'tablet'|'mobile', caption?: string, width?: number, height?: number }
async function createHandler(request: AuthenticatedRequest) {
  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() || "";
    let body: any = {};
    let uploadedRecord: any = null;

    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch (e) {
        // Fallback to text->JSON to provide clearer errors
        const text = await request.text();
        try {
          body = JSON.parse(text);
        } catch (parseErr) {
          return NextResponse.json(
            { error: "Invalid JSON body", details: String(parseErr) },
            { status: 400 }
          );
        }
      }
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      // If an image file is posted directly, upload it to S3 and persist
      const image = form.get("image");
      const breakpoint = (form.get("breakpoint") as string) || "desktop";
      const caption = (form.get("caption") as string) || "hero";

      if (image && image instanceof File) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const now = new Date();
        const yyyy = `${now.getFullYear()}`;
        const mm = `${now.getMonth() + 1}`.padStart(2, "0");
        const dd = `${now.getDate()}`.padStart(2, "0");
        const dateFolder = `${yyyy}-${mm}-${dd}`;

        const originalName = image.name || "upload.jpg";
        const ext = (originalName.split(".").pop() || "jpg").toLowerCase();
        const key = `hero/${breakpoint}/${dateFolder}/${uuidv4()}.${ext}`;

        const putCmd = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: image.type || "image/jpeg",
        });
        await s3Client.send(putCmd);

        const publicUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Persist to DB
        uploadedRecord = await prisma.mediaImage.create({
          data: {
            key,
            url: publicUrl,
            height: undefined,
            alt: breakpoint,
            caption: caption,
            createdBy: request.user?.userId,
            galleryId: "hero",
          },
          select: {
            id: true,
            key: true,
            url: true,
            height: true,
            alt: true,
            caption: true,
            createdAt: true,
          },
        });

        return NextResponse.json(uploadedRecord, { status: 201 });
      }

      // If no file found, fall back to reading fields as plain values
      body = Object.fromEntries(
        Array.from(form.entries()).map(([k, v]) => [k, typeof v === "string" ? v : undefined])
      );
    } else {
      // Try to parse plain text as JSON
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        return NextResponse.json(
          { error: "Unsupported content type or invalid body", contentType, details: String(parseErr) },
          { status: 400 }
        );
      }
    }

    const { key, url, breakpoint, caption, height } = body;

    if (!key || !url) {
      return NextResponse.json({ error: "key and url are required" }, { status: 400 });
    }

    if (!String(key).startsWith("hero/")) {
      return NextResponse.json({ error: "key must start with 'hero/'" }, { status: 400 });
    }

    // Persist to MediaImage
    const created = await prisma.mediaImage.create({
      data: {
        key,
        url,
        height: typeof height === "number" ? height : undefined,
        alt: breakpoint,
        caption: caption ?? "hero",
        createdBy: request.user?.userId,
        galleryId: "hero",
      },
      select: {
        id: true,
        key: true,
        url: true,
        height: true,
        alt: true,
        caption: true,
        createdAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating hero image:", error);
    return NextResponse.json({ error: "Failed to create hero image" }, { status: 500 });
  }
}

export const POST = requireEditor(createHandler);

// DELETE /api/hero?id=UUID&imageKey=key - Delete hero image and optional S3 object
async function deleteHandler(request: AuthenticatedRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const imageKey = request.nextUrl.searchParams.get("imageKey");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await prisma.mediaImage.delete({ where: { id } });

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
    console.error("Error deleting hero image:", error);
    return NextResponse.json({ error: "Failed to delete hero image" }, { status: 500 });
  }
}

export const DELETE = requireEditor(deleteHandler);