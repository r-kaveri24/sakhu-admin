import { jsonWithCors, optionsWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

// Public POST /api/forms/public/contact - create a contact submission and notification
export async function POST(request: Request) {
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
      select: { id: true, name: true, email: true, mobile: true, createdAt: true },
    });

    // Create an admin notification
    await prisma.notification.create({
      data: {
        title: "New contact submission",
        body: `Name: ${item.name}\nEmail: ${item.email ?? "-"}\nMobile: ${item.mobile ?? "-"}`,
        targetType: "contact",
        isSent: false,
      },
    });

    return jsonWithCors({ ok: true, submission: item }, { status: 201 });
  } catch (e: any) {
    console.error("Public POST /api/forms/public/contact error", e);
    return jsonWithCors({ error: "Failed to submit contact form" }, { status: 500 });
  }
}

// CORS preflight
export function OPTIONS() {
  return optionsWithCors();
}