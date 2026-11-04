"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

// Séries uniques (une seule échelle par graphique) : laiton sur papier ivoire, axes et grilles discrets.
const SERIES = "#a8794a";
const AXIS = "#776c61";
const GRID = "#e2d8ca";

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  const tr = useT();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 text-[12px] shadow-md">
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">
        {tr.number(payload[0]!.value)} {unit}
      </p>
    </div>
  );
}

/** Évolution temporelle d'une seule mesure. */
export function TrendChart({ data, dataKey, unit, height = 240 }: { data: Record<string, string | number>[]; dataKey: string; unit: string; height?: number }) {
  const tr = useT();
  return (
    <div style={{ height }} role="img" aria-label={tr("{unit} over time", { unit })}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey={dataKey} stroke={SERIES} strokeWidth={2} fill={`url(#fill-${dataKey})`} activeDot={{ r: 4, fill: SERIES, stroke: "#fffdf9", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barres verticales d'une seule mesure (ex. vues quotidiennes). */
export function ColumnChart({ data, dataKey, unit, height = 220 }: { data: Record<string, string | number>[]; dataKey: string; unit: string; height?: number }) {
  const tr = useT();
  return (
    <div style={{ height }} role="img" aria-label={tr("{unit} per day", { unit })}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="2 4" />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "rgba(168,121,74,0.08)" }} />
          <Bar dataKey={dataKey} fill={SERIES} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Classement horizontal en HTML (lisible, accessible, valeurs en texte). */
export function BarList({ items, unit = "searches", dark }: { items: { name: string; count: number }[]; unit?: string; dark?: boolean }) {
  const tr = useT();
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length) return <p className={cn("text-sm", dark ? "text-paper/50" : "text-muted")}>{tr("Not enough data yet.")}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.name} title={`${tr(i.name)}: ${tr.number(i.count)} ${unit}`}>
          <div className="flex items-baseline justify-between text-[13px]">
            <span>{tr(i.name)}</span>
            <span className={dark ? "tabular-nums text-paper/60" : "tabular-nums text-muted"}>{tr.number(i.count)}</span>
          </div>
          <div className={cn("mt-1 h-2 overflow-hidden rounded-sm", dark ? "bg-paper/10" : "bg-sand")}>
            <div className={cn("h-full rounded-sm", dark ? "bg-brass-light" : "bg-brass")} style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
