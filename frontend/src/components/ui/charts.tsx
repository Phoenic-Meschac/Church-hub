"use client";

import { motion } from "framer-motion";
import { formatMoney } from "@/lib/format";

/* ---------------------------------------------------------------- BarChart */
export function BarChart({
  data,
  currency = "CDF",
}: {
  data: { label: string; in: number; out: number }[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.in, d.out]));
  return (
    <div>
      <div className="flex items-end justify-between gap-3" style={{ height: 200 }}>
        {data.map((d, i) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1.5">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.in / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="w-3.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                title={`Entrées : ${formatMoney(d.in, currency)}`}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.out / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.06 + 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="w-3.5 rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400"
                title={`Sorties : ${formatMoney(d.out, currency)}`}
              />
            </div>
            <span className="text-xs capitalize text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Entrées
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Sorties
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- DonutChart */
const DONUT_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#0ea5e9", "#10b981", "#f59e0b"];

export function DonutChart({
  data,
  size = 180,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={14} />
        {total > 0 &&
          data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * c;
            const offset = -(cumulative / total) * c;
            cumulative += d.value;
            return (
              <motion.circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c}`}
                strokeDashoffset={offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            );
          })}
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-foreground">{d.label}</span>
            <span className="ml-auto font-medium text-muted-foreground">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
        {total === 0 && <p className="text-sm text-muted-foreground">Aucune donnée</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ ProgressRing */
export function ProgressRing({
  value,
  size = 130,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, value) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-semibold text-foreground">{Math.round(value)}%</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
