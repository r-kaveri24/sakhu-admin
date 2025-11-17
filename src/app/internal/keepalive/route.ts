import { NextResponse, NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabaseServer';
import { logEvent, maskTokenId, getLastErrorEvents } from '@/lib/logger';
import { sendFailureAlert } from '@/lib/alerts';

// Internal keepalive endpoint. Not documented in public API docs.
// Returns service status, current timestamp, and Supabase connectivity status.

type SupabaseStatus = 'connected' | 'missing_config' | 'error';

// Simple in-memory rate limiter keyed by token|ip
const lastHitByKey = new Map<string, number>();

function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0].trim() || null;
}

function isIpAllowed(ip: string | null): boolean {
  const raw = process.env.SCHEDULER_IP_ALLOWLIST || '';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (list.length === 0) return true; // no restriction configured
  if (!ip) return false;
  return list.includes(ip);
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const bypass = (process.env.KEEPALIVE_RATE_LIMIT_BYPASS || 'false').toLowerCase() === 'true';
  if (bypass) return { allowed: true, retryAfterSec: 0 };
  const windowSec = parseInt(process.env.KEEPALIVE_RATE_LIMIT_WINDOW_SECONDS || '60', 10);
  const now = Date.now();
  const last = lastHitByKey.get(key) || 0;
  if (now - last < windowSec * 1000) {
    const retryAfterMs = windowSec * 1000 - (now - last);
    return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }
  lastHitByKey.set(key, now);
  return { allowed: true, retryAfterSec: 0 };
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSupabaseStatus(): Promise<SupabaseStatus> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return 'missing_config';

    // Lazy import to avoid initializing Prisma when DATABASE_URL is absent
    const { prisma } = await import('@/lib/prisma');
    // Lightweight connectivity check
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch {
    return 'error';
  }
}

export async function GET(req: NextRequest) {
  const routeName = '/internal/keepalive';
  const method = req.method || 'GET';
  const startMs = Date.now();
  const timestamp = formatTimestampWithOffset(new Date());
  // Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    logEvent({
      route: routeName,
      timestamp,
      method,
      statusCode: 401,
      ip: getClientIp(req),
      tokenIdMasked: undefined,
      supabaseResponseCode: undefined,
      latencyMs: Date.now() - startMs,
      error: 'missing authorization',
    });
    // failure streak and alert
    await considerAlert(routeName, 'missing authorization');
    return NextResponse.json({ status: 'error', timestamp, code: 401, message: 'missing authorization' }, { status: 401 });
  }
  const providedToken = authHeader.slice(7).trim();
  const expectedToken = process.env.KEEPALIVE_AUTH_TOKEN || process.env.SCHEDULER_TOKEN;
  if (!expectedToken) {
    logEvent({
      route: routeName,
      timestamp,
      method,
      statusCode: 500,
      ip: getClientIp(req),
      tokenIdMasked: maskTokenId(providedToken),
      supabaseResponseCode: undefined,
      latencyMs: Date.now() - startMs,
      error: 'scheduler token not configured',
    });
    await considerAlert(routeName, 'scheduler token not configured');
    return NextResponse.json({ status: 'error', timestamp, code: 500, message: 'scheduler token not configured' }, { status: 500 });
  }
  if (providedToken !== expectedToken) {
    logEvent({
      route: routeName,
      timestamp,
      method,
      statusCode: 403,
      ip: getClientIp(req),
      tokenIdMasked: maskTokenId(providedToken),
      supabaseResponseCode: undefined,
      latencyMs: Date.now() - startMs,
      error: 'invalid token',
    });
    await considerAlert(routeName, 'invalid token');
    return NextResponse.json({ status: 'error', timestamp, code: 403, message: 'invalid token' }, { status: 403 });
  }

  // Optional IP allowlist check
  const ip = getClientIp(req);
  if (!isIpAllowed(ip)) {
    logEvent({
      route: routeName,
      timestamp,
      method,
      statusCode: 403,
      ip,
      tokenIdMasked: maskTokenId(providedToken),
      supabaseResponseCode: undefined,
      latencyMs: Date.now() - startMs,
      error: 'ip not allowed',
    });
    await considerAlert(routeName, 'ip not allowed');
    return NextResponse.json({ status: 'error', timestamp, code: 403, message: 'ip not allowed' }, { status: 403 });
  }

  // Rate limit per token|ip
  const rl = checkRateLimit(`${providedToken}|${ip ?? 'unknown'}`);
  if (!rl.allowed) {
    logEvent({
      route: routeName,
      timestamp,
      method,
      statusCode: 429,
      ip,
      tokenIdMasked: maskTokenId(providedToken),
      supabaseResponseCode: undefined,
      latencyMs: Date.now() - startMs,
      error: 'rate limit exceeded',
    });
    await considerAlert(routeName, 'rate limit exceeded');
    const resp = NextResponse.json({ status: 'error', timestamp, code: 429, message: 'rate limit exceeded' }, { status: 429 });
    resp.headers.set('Retry-After', String(rl.retryAfterSec));
    return resp;
  }

  const supabaseStatusString = await getSupabaseStatus();

  // Minimal authenticated read against Supabase using a server-side key.
  // Uses a head-only select or RPC depending on KEEPALIVE_TABLE env.
  let supabaseResponseCode = 0;
  let supabaseAction = 'none';
  try {
    const supabase = createServerSupabase();
    if (!supabase) {
      supabaseAction = 'missing_config';
    } else {
      const target = (process.env.KEEPALIVE_TABLE || 'keepalive_meta').trim();

      const attemptRead = async (): Promise<number> => {
        try {
          if (target.toLowerCase().startsWith('rpc:')) {
            const rpcName = target.slice(4).trim();
            supabaseAction = `rpc ${rpcName}`;
            const { error } = await supabase.rpc(rpcName);
            return error?.status ?? 200;
          } else {
            supabaseAction = `select ${target} head limit 1`;
            const { error } = await supabase
              .from(target)
              .select('*', { head: true, count: 'estimated' })
              .limit(1);
            return error?.status ?? 200;
          }
        } catch (err: any) {
          return typeof err?.status === 'number' ? err.status : 500;
        }
      };

      // First attempt
      supabaseResponseCode = await attemptRead();

      // One conservative retry with short exponential backoff on 5xx
      if (supabaseResponseCode >= 500 && supabaseResponseCode < 600) {
        const baseMs = 120; // conservative base delay
        const delayMs = Math.min(300, Math.max(80, baseMs * 2)); // simple exponential backoff for single retry
        // Log retry scheduling
        logEvent({
          route: routeName,
          timestamp,
          method,
          statusCode: 200,
          ip,
          tokenIdMasked: maskTokenId(providedToken),
          supabaseResponseCode: supabaseResponseCode,
          latencyMs: Date.now() - startMs,
          error: `supabase ${supabaseResponseCode} - retry in ${delayMs}ms`,
        });
        await sleep(delayMs);
        // Second attempt (final)
        supabaseResponseCode = await attemptRead();
      }
    }
  } catch (e: any) {
    supabaseResponseCode = typeof e?.status === 'number' ? e.status : 500;
    supabaseAction = 'error';
  }

  // Log structured event for observability
  logEvent({
    route: routeName,
    timestamp,
    method,
    statusCode: 200,
    ip,
    tokenIdMasked: maskTokenId(providedToken),
    supabaseResponseCode,
    latencyMs: Date.now() - startMs,
    error: supabaseResponseCode === 200 ? null : supabaseAction,
  });

  const details = supabaseResponseCode === 200
    ? 'read success'
    : supabaseAction === 'missing_config'
      ? 'missing_config'
      : 'read error';

  // On success, reset failure streak and record a visit for monitoring
  resetAlertStreak();
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.siteVisit.create({
      data: {
        id: crypto.randomUUID(),
        page: 'internal/keepalive',
        userAgent: req.headers.get('user-agent') ?? null,
        ip: ip ?? null,
      },
    });
  } catch {
    // non-critical
  }

  return NextResponse.json(
    {
      status: 'ok',
      timestamp,
      supabaseStatus: supabaseResponseCode,
      details,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  // Support POST for environments that prefer explicit health checks
  return GET(req);
}

// ========
// Alerts
// ========
const failureState = {
  streak: 0,
  alertSent: false,
};

async function considerAlert(route: string, reason: string) {
  failureState.streak += 1;
  if (failureState.streak >= 2 && !failureState.alertSent) {
    failureState.alertSent = true;
    const lastErrors = getLastErrorEvents(route, 5);
    await sendFailureAlert(route, reason, lastErrors);
  }
}

function resetAlertStreak() {
  failureState.streak = 0;
  failureState.alertSent = false;
}