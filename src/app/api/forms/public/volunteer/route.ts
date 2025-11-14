import { jsonWithCors, optionsWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

// Public POST /api/forms/public/volunteer - create a volunteer submission and notification
export async function POST(request: Request) {
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
        hoursPerDay: typeof body?.hoursPerDay === "number" ? body.hoursPerDay : null,
        preferredCity: body?.preferredCity || null,
      },
      select: { id: true, name: true, email: true, mobile: true, createdAt: true },
    });

    // Create an admin notification
    await prisma.notification.create({
      data: {
        title: "New volunteer submission",
        body: `Name: ${item.name}\nEmail: ${item.email ?? "-"}\nMobile: ${item.mobile ?? "-"}`,
        targetType: "volunteer",
        isSent: false,
      },
    });

    return jsonWithCors({ ok: true, submission: item }, { status: 201 });
  } catch (e: any) {
    console.error("Public POST /api/forms/public/volunteer error", e);
    return jsonWithCors({ error: "Failed to submit volunteer form" }, { status: 500 });
  }
}

// CORS preflight
export function OPTIONS() {
  return optionsWithCors();
}