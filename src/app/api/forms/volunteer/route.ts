import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";

// GET /api/forms/volunteer - list volunteer submissions
export async function GET() {
  const items = await prisma.volunteerSubmission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      address: true,
      occupation: true,
      areasOfWork: true,
      availability: true,
      fromTime: true,
      toTime: true,
      hoursPerDay: true,
      preferredCity: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ items });
}

// Optional: POST to insert a volunteer submission
export const POST = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const item = await prisma.volunteerSubmission.create({
      data: {
        name: body?.name || "",
        email: body?.email || null,
        mobile: body?.mobile || null,
        address: body?.address || null,
        occupation: body?.occupation || null,
        areasOfWork: body?.areasOfWork || null,
        availability: body?.availability || null,
        fromTime: body?.fromTime || null,
        toTime: body?.toTime || null,
        hoursPerDay: typeof body?.hoursPerDay === 'number' ? body?.hoursPerDay : null,
        preferredCity: body?.preferredCity || null,
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
    console.error("POST /api/forms/volunteer error", e);
    return NextResponse.json({ error: "Failed to create volunteer submission" }, { status: 500 });
  }
});

// DELETE /api/forms/volunteer?id=UUID
export const DELETE = requireEditor(async (request: AuthenticatedRequest) => {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.volunteerSubmission.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/forms/volunteer error", e);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
});