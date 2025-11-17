import { NextResponse, NextRequest } from 'next/server';
import { getLastErrorEvents } from '@/lib/logger';
import { sendFailureAlert } from '@/lib/alerts';

function formatTimestampWithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${oh}:${om}`;
}

export async function GET(req: NextRequest) {
  const timestamp = formatTimestampWithOffset(new Date());
  // Authorize same as keepalive
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.KEEPALIVE_AUTH_TOKEN || process.env.SCHEDULER_TOKEN;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ') || !expectedToken || authHeader.slice(7).trim() !== expectedToken) {
    return NextResponse.json({ status: 'error', timestamp, code: 401, message: 'unauthorized' }, { status: 401 });
  }

  const expectedIntervalSec = parseInt(process.env.KEEPALIVE_EXPECTED_INTERVAL_SECONDS || '300', 10);
  let lastVisitAt: Date | null = null;
  try {
    const { prisma } = await import('@/lib/prisma');
    const last = await prisma.siteVisit.findFirst({
      where: { page: 'internal/keepalive' },
      orderBy: { createdAt: 'desc' },
    });
    lastVisitAt = last?.createdAt ?? null;
  } catch {
    // ignore
  }

  if (!lastVisitAt) {
    const reason = 'scheduler missed run (no calls recorded)';
    const lastErrors = getLastErrorEvents('/internal/keepalive', 5);
    await sendFailureAlert('/internal/keepalive', reason, lastErrors);
    return NextResponse.json({ status: 'ok', timestamp, supabaseStatus: 0, details: 'no-calls' }, { status: 200 });
  }

  const ageMs = Date.now() - lastVisitAt.getTime();
  if (ageMs > expectedIntervalSec * 1000) {
    const reason = `scheduler missed run (> ${expectedIntervalSec}s since last)`;
    const lastErrors = getLastErrorEvents('/internal/keepalive', 5);
    await sendFailureAlert('/internal/keepalive', reason, lastErrors);
    return NextResponse.json({ status: 'ok', timestamp, supabaseStatus: 0, details: 'stale' }, { status: 200 });
  }

  return NextResponse.json({ status: 'ok', timestamp, supabaseStatus: 0, details: 'recent' }, { status: 200 });
}

export async function POST(req: NextRequest) {
  return GET(req);
}