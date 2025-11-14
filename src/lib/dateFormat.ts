export function formatDMYFromParts(day?: number | null, month?: number | null, year?: number | null): string | null {
  if (!day || !month || !year) return null;
  // Clamp to safe ranges
  const d = Math.min(31, Math.max(1, Math.floor(day)));
  const m = Math.min(12, Math.max(1, Math.floor(month)));
  const y = Math.min(9999, Math.max(1, Math.floor(year)));
  // Always return in deterministic "DD Month YYYY" format, independent of locale
  return `${String(d).padStart(2, '0')} ${monthName(m)} ${y}`;
}

export function formatDMYFromISO(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = monthName(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatNewsDate(opts: { day?: number | null; month?: number | null; year?: number | null; fallbackISO?: string | null }): string | null {
  const byParts = formatDMYFromParts(opts.day, opts.month, opts.year);
  if (byParts) return byParts;
  return formatDMYFromISO(opts.fallbackISO);
}

function monthName(m: number): string {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[Math.min(12, Math.max(1, m)) - 1];
}

export function ensureMonthNumber(month: string | number | null | undefined): number | null {
  if (month == null) return null;
  if (typeof month === 'number') return month;
  const trimmed = month.trim();
  const num = Number(trimmed);
  if (!isNaN(num)) return num;
  const idx = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(trimmed.toLowerCase());
  return idx >= 0 ? idx + 1 : null;
}