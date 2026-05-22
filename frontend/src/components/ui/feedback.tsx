"use client";

import { Loader2 } from "lucide-react";
import { cn, initials, colorFromString } from "@/lib/utils";
import { mediaUrl } from "@/lib/api";

type Tone = "brand" | "green" | "amber" | "rose" | "sky" | "violet" | "slate";

const TONES: Record<Tone, string> = {
  brand: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/25",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/25",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/25",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/25",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/25",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/25",
  slate: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/25",
};

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  active: "green",
  present: "green",
  validated: "green",
  done: "green",
  late: "amber",
  pending: "amber",
  in_progress: "sky",
  inactive: "slate",
  excused: "violet",
  todo: "slate",
  suspended: "rose",
  absent: "rose",
  cancelled: "rose",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "slate"}>{label}</Badge>;
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const url = mediaUrl(src ?? null);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover ring-2 ring-border", className)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-border",
        colorFromString(name),
        className
      )}
    >
      {initials(name)}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-500 dark:text-brand-400", className)} />;
}

export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-brand-600 ring-1 ring-border dark:text-brand-300">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
