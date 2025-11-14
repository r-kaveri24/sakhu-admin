import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor, AuthenticatedRequest } from "@/lib/auth";

function toDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const GET = requireEditor(async (req: AuthenticatedRequest) => {
  const rangeParam = (req as unknown as NextRequest).nextUrl.searchParams.get("range");
  let days = 30;
  if (rangeParam) {
    const n = parseInt(rangeParam, 10);
    if (!Number.isNaN(n) && n > 0 && n <= 365) days = n;
  }
  // For 'Today' we want hourly buckets for the current day
  const now = new Date();
  const since = new Date(now);
  if (days === 1) {
    since.setHours(0, 0, 0, 0);
  } else {
    since.setDate(since.getDate() - days);
  }

  // Load visits (if none exist, will return empty and UI can show 0s)
  const visits = await prisma.siteVisit.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Load submissions
  const donations = await prisma.donationSubmission.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, amount: true },
    orderBy: { createdAt: "asc" },
  });
  const contacts = await prisma.contactSubmission.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const volunteers = await prisma.volunteerSubmission.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  let visitsSeries: { day: string; count: number }[] = [];
  let donationSeries: { day: string; count: number }[] = [];
  let contactSeries: { day: string; count: number }[] = [];
  let volunteerSeries: { day: string; count: number }[] = [];
  let moneyGenerated = 0;

  if (days === 1) {
    // Hourly buckets for the current day (00-23)
    const visitHourCounts: Record<string, number> = {};
    const donationHourCounts: Record<string, number> = {};
    const contactHourCounts: Record<string, number> = {};
    const volunteerHourCounts: Record<string, number> = {};

    const isToday = (d: Date) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    for (const v of visits) {
      const dt = new Date(v.createdAt);
      if (isToday(dt)) {
        const h = String(dt.getHours()).padStart(2, "0");
        visitHourCounts[h] = (visitHourCounts[h] || 0) + 1;
      }
    }
    for (const d of donations) {
      const dt = new Date(d.createdAt);
      if (isToday(dt)) {
        const h = String(dt.getHours()).padStart(2, "0");
        donationHourCounts[h] = (donationHourCounts[h] || 0) + 1;
        moneyGenerated += typeof d.amount === "number" ? d.amount : 0;
      }
    }
    for (const c of contacts) {
      const dt = new Date(c.createdAt);
      if (isToday(dt)) {
        const h = String(dt.getHours()).padStart(2, "0");
        contactHourCounts[h] = (contactHourCounts[h] || 0) + 1;
      }
    }
    for (const v of volunteers) {
      const dt = new Date(v.createdAt);
      if (isToday(dt)) {
        const h = String(dt.getHours()).padStart(2, "0");
        volunteerHourCounts[h] = (volunteerHourCounts[h] || 0) + 1;
      }
    }

    const hours: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    visitsSeries = hours.map((h) => ({ day: h, count: visitHourCounts[h] || 0 }));
    donationSeries = hours.map((h) => ({ day: h, count: donationHourCounts[h] || 0 }));
    contactSeries = hours.map((h) => ({ day: h, count: contactHourCounts[h] || 0 }));
    volunteerSeries = hours.map((h) => ({ day: h, count: volunteerHourCounts[h] || 0 }));
  } else {
    // Aggregate to day buckets
    const visitDayCounts: Record<string, number> = {};
    for (const v of visits) {
      const day = toDay(new Date(v.createdAt));
      visitDayCounts[day] = (visitDayCounts[day] || 0) + 1;
    }

    const donationDayCounts: Record<string, number> = {};
    for (const d of donations) {
      const day = toDay(new Date(d.createdAt));
      donationDayCounts[day] = (donationDayCounts[day] || 0) + 1;
      moneyGenerated += typeof d.amount === "number" ? d.amount : 0;
    }

    const contactDayCounts: Record<string, number> = {};
    for (const c of contacts) {
      const day = toDay(new Date(c.createdAt));
      contactDayCounts[day] = (contactDayCounts[day] || 0) + 1;
    }

    const volunteerDayCounts: Record<string, number> = {};
    for (const v of volunteers) {
      const day = toDay(new Date(v.createdAt));
      volunteerDayCounts[day] = (volunteerDayCounts[day] || 0) + 1;
    }

    // Build continuous day series for last N days
    const seriesDays: string[] = [];
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - (days - 1));
    for (let i = 0; i < days; i++) {
      seriesDays.push(toDay(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    visitsSeries = seriesDays.map((day) => ({ day, count: visitDayCounts[day] || 0 }));
    donationSeries = seriesDays.map((day) => ({ day, count: donationDayCounts[day] || 0 }));
    contactSeries = seriesDays.map((day) => ({ day, count: contactDayCounts[day] || 0 }));
    volunteerSeries = seriesDays.map((day) => ({ day, count: volunteerDayCounts[day] || 0 }));
  }

  return NextResponse.json({
    rangeDays: days,
    visits: visitsSeries,
    submissions: {
      donation: donationSeries,
      contact: contactSeries,
      volunteer: volunteerSeries,
    },
    totals: {
      visits: visits.length,
      donationsCount: donations.length,
      moneyGenerated,
      contactsCount: contacts.length,
      volunteersCount: volunteers.length,
    },
  });
});