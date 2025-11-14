import { jsonWithCors, optionsWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

// Public POST /api/forms/public/donation - create a donation submission and notification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount ?? NaN);

    const item = await prisma.donationSubmission.create({
      data: {
        name: body?.name || "",
        email: body?.email || null,
        mobile: body?.mobile || null,
        state: body?.state || null,
        address: body?.address || null,
        amount: Number.isFinite(amount) ? amount : null,
        // Optional fields not currently sent by website; left null if absent
        adharCardNo: body?.adharCardNo || null,
        panCardNo: body?.panCardNo || null,
        adharFileUrl: body?.adharFileUrl || null,
        panFileUrl: body?.panFileUrl || null,
      },
      select: { id: true, name: true, email: true, mobile: true, amount: true, createdAt: true },
    });

    // Create an admin notification
    await prisma.notification.create({
      data: {
        title: "New donation submission",
        body: `Name: ${item.name}\nEmail: ${item.email ?? "-"}\nMobile: ${item.mobile ?? "-"}\nAmount: ${item.amount ?? "-"}`,
        targetType: "donation",
        isSent: false,
      },
    });

    return jsonWithCors({ ok: true, submission: item }, { status: 201 });
  } catch (e: any) {
    console.error("Public POST /api/forms/public/donation error", e);
    return jsonWithCors({ error: "Failed to submit donation form" }, { status: 500 });
  }
}

// CORS preflight
export function OPTIONS() {
  return optionsWithCors();
}