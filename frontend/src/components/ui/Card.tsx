"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CountUp } from "./CountUp";

export function Card({
  children,
  className,
  hover,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={cn("card p-5", hover && "card-hover", className)}>{children}</div>;
}

const ACCENTS: Record<string, string> = {
  indigo: "from-indigo-500/25 to-indigo-500/0 text-indigo-500 dark:text-indigo-300",
  violet: "from-violet-500/25 to-violet-500/0 text-violet-500 dark:text-violet-300",
  fuchsia: "from-fuchsia-500/25 to-fuchsia-500/0 text-fuchsia-500 dark:text-fuchsia-300",
  emerald: "from-emerald-500/25 to-emerald-500/0 text-emerald-500 dark:text-emerald-300",
  amber: "from-amber-500/25 to-amber-500/0 text-amber-500 dark:text-amber-300",
  sky: "from-sky-500/25 to-sky-500/0 text-sky-500 dark:text-sky-300",
  rose: "from-rose-500/25 to-rose-500/0 text-rose-500 dark:text-rose-300",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "indigo",
  format,
  suffix,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: keyof typeof ACCENTS;
  format?: (n: number) => string;
  suffix?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover relative overflow-hidden p-5"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl",
          ACCENTS[accent]
        )}
      />
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-border",
            ACCENTS[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        <CountUp value={value} format={format} />
        {suffix && <span className="ml-1 text-lg text-muted-foreground">{suffix}</span>}
      </div>
    </motion.div>
  );
}
