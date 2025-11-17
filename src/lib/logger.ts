import { createHash } from 'crypto';

export type LogEvent = {
  route: string;
  timestamp: string;
  method: string;
  statusCode: number;
  ip?: string | null;
  tokenIdMasked?: string;
  supabaseResponseCode?: number;
  latencyMs: number;
  error?: string | null;
};

export function maskTokenId(token: string): string {
  try {
    return createHash('sha256').update(token).digest('hex').slice(0, 12);
  } catch {
    // Fallback: partial reveal
    const start = token.slice(0, 4);
    const end = token.slice(-4);
    return `${start}****${end}`;
  }
}

export function logEvent(event: LogEvent): void {
  // Structured JSON log for downstream sinks (Cloud logs / ELK / Datadog)
  // Ensure minimal PII and masked token id.
  const payload = {
    route: event.route,
    timestamp: event.timestamp,
    method: event.method,
    statusCode: event.statusCode,
    ip: event.ip ?? null,
    tokenIdMasked: event.tokenIdMasked ?? null,
    supabaseResponseCode: typeof event.supabaseResponseCode === 'number' ? event.supabaseResponseCode : null,
    latencyMs: event.latencyMs,
    error: event.error ?? null,
  };
  // Log as single-line JSON for searchability
  console.log(JSON.stringify(payload));

  // Keep a small in-memory buffer of recent error events per route
  try {
    if (payload.error) {
      pushErrorEvent(payload.route, payload);
    }
  } catch {
    // ignore buffer errors
  }
}

// In-memory error buffers for quick alert context (non-persistent)
const errorBuffers: Map<string, Array<{
  route: string;
  timestamp: string;
  method: string;
  statusCode: number;
  ip: string | null;
  tokenIdMasked: string | null;
  supabaseResponseCode: number | null;
  latencyMs: number;
  error: string | null;
}>> = new Map();

function pushErrorEvent(route: string, event: {
  route: string;
  timestamp: string;
  method: string;
  statusCode: number;
  ip: string | null;
  tokenIdMasked: string | null;
  supabaseResponseCode: number | null;
  latencyMs: number;
  error: string | null;
}) {
  const buf = errorBuffers.get(route) ?? [];
  buf.push(event);
  // cap buffer to last 20 error events
  while (buf.length > 20) buf.shift();
  errorBuffers.set(route, buf);
}

export function getLastErrorEvents(route: string, count: number = 5) {
  const buf = errorBuffers.get(route) ?? [];
  return buf.slice(Math.max(0, buf.length - count));
}