import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";

// GET /api/forms/contact - list contact submissions
export async function GET() {
  const items = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      address: true,
      note: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ items });
}

// Optional: POST to insert a contact submission
export const POST = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const item = await prisma.contactSubmission.create({
      data: {
        name: body?.name || "",
        email: body?.email || null,
        mobile: body?.mobile || null,
        address: body?.address || null,
        note: body?.note || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/forms/contact error", e);
    return NextResponse.json({ error: "Failed to create contact submission" }, { status: 500 });
  }
});

// DELETE /api/forms/contact?id=UUID
export const DELETE = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.contactSubmission.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/forms/contact error", e);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
});