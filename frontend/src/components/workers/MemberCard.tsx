"use client";

import { motion } from "framer-motion";
import { Church } from "lucide-react";
import type { Worker } from "@/lib/types";
import { Avatar } from "@/components/ui/feedback";
import { cn, colorFromString } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export function MemberCard({
  worker,
  churchName = "ChurchHub",
  onClick,
}: {
  worker: Worker;
  churchName?: string;
  onClick?: () => void;
}) {
  const grad = colorFromString(worker.full_name);
  const seed = worker.id || worker.matricule.length || 1;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.015 }}
      className="group relative aspect-[1.58/1] w-full overflow-hidden rounded-2xl text-left text-white shadow-xl shadow-black/30"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", grad)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-white/10" />
      <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 -skew-x-12 bg-white/25 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />

      <div className="relative flex h-full flex-col justify-between p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Church className="h-4 w-4 opacity-90" />
            <span className="truncate text-xs font-semibold uppercase tracking-wider opacity-90">
              {churchName}
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            Carte ouvrier
          </span>
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="relative h-7 w-9 shrink-0 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner">
            <div className="absolute inset-1 rounded-[3px] border border-amber-700/30" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-700/30" />
          </div>
          <Avatar name={worker.full_name} src={worker.photo} size={44} className="ring-white/50" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight">{worker.full_name}</p>
            <p className="truncate text-xs opacity-80">
              {worker.function_name || "Ouvrier"}
              {worker.department_name ? ` · ${worker.department_name}` : ""}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-sm tracking-[0.18em] opacity-95">{worker.matricule}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70">
              Membre depuis {worker.join_date ? formatDate(worker.join_date) : "—"}
            </p>
          </div>
          <div className="grid h-9 w-9 grid-cols-4 grid-rows-4 gap-px rounded bg-white/90 p-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-[1px]",
                  (i * 7 + seed) % 3 === 0 ? "bg-slate-900" : "bg-transparent"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
