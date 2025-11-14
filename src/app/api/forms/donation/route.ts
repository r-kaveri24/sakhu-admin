import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";

// GET /api/forms/donation - list donation submissions
export async function GET() {
  const items = await prisma.donationSubmission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      state: true,
      address: true,
      amount: true,
      adharCardNo: true,
      panCardNo: true,
      adharFileUrl: true,
      panFileUrl: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ items });
}

// Optional: POST to insert a donation submission (for testing/admin add)
export const POST = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const item = await prisma.donationSubmission.create({
      data: {
        name: body?.name || "",
        email: body?.email || null,
        mobile: body?.mobile || null,
        state: body?.state || null,
        address: body?.address || null,
        adharCardNo: body?.adharCardNo || null,
        panCardNo: body?.panCardNo || null,
        adharFileUrl: body?.adharFileUrl || null,
        panFileUrl: body?.panFileUrl || null,
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
    console.error("POST /api/forms/donation error", e);
    return NextResponse.json({ error: "Failed to create donation submission" }, { status: 500 });
  }
});

// DELETE /api/forms/donation?id=UUID - remove a submission
export const DELETE = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.donationSubmission.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/forms/donation error", e);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
});