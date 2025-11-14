"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Header from "@/components/admin/Header";
import { ResponsiveContainer, BarChart as RBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from "recharts";

type DayPoint = { day: string; count: number };
type Metrics = {
  rangeDays: number;
  visits: DayPoint[];
  submissions: {
    donation: DayPoint[];
    contact: DayPoint[];
    volunteer: DayPoint[];
  };
  totals: {
    visits: number;
    donationsCount: number;
    moneyGenerated: number;
    contactsCount: number;
    volunteersCount: number;
  };
};

function BarChart({ title, series, color = "#2E3192", range }: { title: string; series: DayPoint[]; color?: string; range: "1" | "7" | "30" | "365" }) {
  // Build display series: daily for week, weekly buckets for 30 days, monthly buckets for year
  const displaySeries = useMemo(() => {
    if (range === "30") {
      const weeks: DayPoint[] = [];
      let w = 1;
      for (let i = 0; i < series.length; i += 7) {
        const slice = series.slice(i, i + 7);
        const sum = slice.reduce((acc, p) => acc + (p.count || 0), 0);
        weeks.push({ day: `W${w}`, count: sum });
        w++;
      }
      return weeks;
    }
    if (range === "365") {
      const monthMap = new Map<string, number>();
      for (const p of series) {
        const d = new Date(p.day);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthMap.set(key, (monthMap.get(key) || 0) + (p.count || 0));
        }
      }
      const sorted = Array.from(monthMap.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
      return sorted.map(([key, sum]) => {
        const [y, m] = key.split("-");
        const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        const label = dt.toLocaleDateString(undefined, { month: "short" });
        return { day: label, count: sum };
      });
    }
    return series;
  }, [series, range]);

  const yMax = useMemo(() => {
    const max = Math.max(0, ...displaySeries.map((s) => s.count));
    return max <= 10 ? 10 : Math.ceil(max * 1.1);
  }, [displaySeries]);

  const formatTick = useCallback((value: string) => {
    if (range === "1") {
      // Hourly labels for Today, show HH:00
      return `${String(value).padStart(2, "0")}:00`;
    }
    if (range === "7") {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { weekday: "short" });
      } catch {}
    }
    // For 30-day weekly and 365 monthly aggregation, labels are already category strings
    return value;
  }, [range]);

  const hourTicks = useMemo(() => (range === "1" ? ["00", "04", "08", "12", "16", "20"] : undefined), [range]);

  return (
    <div className="bg-white rounded-md shadow border h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold" style={{ color }}>{title}</div>
        </div>
        {/* Chart area rendered with Recharts */}
        <div className="h-64 relative bg-gray-50 rounded-md">
          <ResponsiveContainer width="100%" height="100%">
            <RBarChart data={displaySeries} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" tickFormatter={formatTick} tick={{ fill: '#374151', fontSize: 11 }} ticks={hourTicks} axisLine={{ stroke: '#9CA3AF' }} />
              <YAxis domain={[0, yMax]} allowDecimals={false} tick={{ fill: '#374151', fontSize: 11 }} axisLine={{ stroke: '#9CA3AF' }} />
              <Tooltip formatter={(value: any) => [String(value), 'Count']} labelFormatter={(label: any) => String(label)} />
              <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "#2E3192" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-white rounded-md shadow border p-4" style={{ borderTopWidth: 4, borderTopColor: accent }}>
      <div className="text-xs font-semibold" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-semibold text-black mt-1">{value}</div>
    </div>
  );
}

export default function AdminHomePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"1" | "7" | "30" | "365">("30");
  const [seriesType, setSeriesType] = useState<"visits" | "donation" | "contact" | "volunteer">("visits");
  const seriesLabel = useMemo(() => {
    switch (seriesType) {
      case "visits": return "Website Visits";
      case "donation": return "Donation Submissions";
      case "contact": return "Contact Submissions";
      case "volunteer": return "Volunteer Submissions";
      default: return "";
    }
  }, [seriesType]);
  const seriesColor = useMemo(() => {
    switch (seriesType) {
      case "visits": return "#2E3192"; // blue
      case "donation": return "#22C55E"; // green
      case "contact": return "#F59E0B"; // amber
      case "volunteer": return "#EF4444"; // red
      default: return "#2E3192";
    }
  }, [seriesType]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/metrics?range=${range}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load metrics");
        const data = await res.json();
        if (!ignore) setMetrics(data);
      } catch (e: any) {
        if (!ignore) setError(e.message || "Failed to load metrics");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [range]);

  return (
    <div className="h-full bg-white rounded-md flex flex-col">
      <div className="flex-1 p-4 overflow-auto ">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-black">Home Dashboard</div>
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="shadow rounded px-2 py-1 text-black"
              aria-label="Select range"
            >
              <option value="1">Today</option>
              <option value="7">Week</option>
              <option value="30">30 Days</option>
              <option value="365">Year</option>
            </select>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-600 mb-3">Loading metrics...</div>}
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 font-bold">
          <StatCard label="Total Visits" value={metrics?.totals.visits ?? 0} accent="#2E3192" />
          <StatCard label="Donation Submissions" value={metrics?.totals.donationsCount ?? 0} accent="#22C55E" />
          <StatCard label="Money Generated" value={(metrics?.totals.moneyGenerated ?? 0).toLocaleString()} accent="#F59E0B" />
          <StatCard label="Contacts / Volunteers" value={`${metrics?.totals.contactsCount ?? 0} / ${metrics?.totals.volunteersCount ?? 0}`} accent="#EF4444" />
        </div>

        {/* Series selector and label above the chart */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold" style={{ color: seriesColor }}>{seriesLabel}</div>
          <select
            value={seriesType}
            onChange={(e) => setSeriesType(e.target.value as any)}
            className="shadow rounded px-2 py-1 text-black "
            aria-label="Select series"
          >
            <option value="visits">Website Visits</option>
            <option value="donation">Donation Submissions</option>
            <option value="contact">Contact Submissions</option>
            <option value="volunteer">Volunteer Submissions</option>
          </select>
        </div>

        {/* Single chart controlled by dropdowns */}
        <div className=" h-[65%] gap-4">
          {(() => {
            const rangeLabel = range === "1" ? "Today" : range === "7" ? "Week" : range === "30" ? "30 Days" : "Year";
            const map: Record<string, { title: string; series: DayPoint[]; color: string }> = {
              visits: { title: `Website Visits (${rangeLabel})`, series: metrics?.visits ?? [], color: "#2E3192" },
              donation: { title: `Donation Submissions (${rangeLabel})`, series: metrics?.submissions.donation ?? [], color: "#22C55E" },
              contact: { title: `Contact Submissions (${rangeLabel})`, series: metrics?.submissions.contact ?? [], color: "#F59E0B" },
              volunteer: { title: `Volunteer Submissions (${rangeLabel})`, series: metrics?.submissions.volunteer ?? [], color: "#EF4444" },
            };
            const selected = map[seriesType];
            return <BarChart title={selected.title} series={selected.series} color={selected.color} range={range} />;
          })()}
        </div>
      </div>
    </div>
  );
}