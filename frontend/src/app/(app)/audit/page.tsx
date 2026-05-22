"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Activity,
  Search,
  ChevronDown,
} from "lucide-react";
import type { AuditLog } from "@/lib/types";
import { useEntities } from "@/lib/hooks";
import { PageHeader, LoadingBlock, EmptyState, Badge } from "@/components/ui/feedback";
import { Input, Select, Field } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { relativeTime, formatDateTime } from "@/lib/format";

const ACTION_META: Record<string, { icon: React.ElementType; cls: string }> = {
  create: { icon: Plus, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  update: { icon: Pencil, cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  delete: { icon: Trash2, cls: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  login: { icon: LogIn, cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300" },
  logout: { icon: LogOut, cls: "bg-slate-500/15 text-muted-foreground" },
  custom: { icon: Activity, cls: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
};

const MODULE_LABELS: Record<string, string> = {
  accounts: "IAM",
  departments: "Départements",
  workers: "Ouvriers",
  treasury: "Trésorerie",
  core: "Général",
};

function renderChanges(changes: Record<string, unknown>) {
  return (
    <div className="mt-2 space-y-1 rounded-lg bg-muted p-3 font-mono text-xs">
      {Object.entries(changes).map(([key, val]) => {
        if (val && typeof val === "object" && "old" in (val as object) && "new" in (val as object)) {
          const v = val as { old: unknown; new: unknown };
          return (
            <div key={key} className="text-muted-foreground">
              <span className="text-muted-foreground">{key}</span>:{" "}
              <span className="text-rose-600 dark:text-rose-300">{String(v.old ?? "∅")}</span>{" "}
              <span className="text-muted-foreground/70">→</span>{" "}
              <span className="text-emerald-600 dark:text-emerald-300">{String(v.new ?? "∅")}</span>
            </div>
          );
        }
        return (
          <div key={key} className="text-muted-foreground">
            <span className="text-muted-foreground">{key}</span>: {String(val ?? "∅")}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const params = {
    search: search || undefined,
    module: module || undefined,
    action: action || undefined,
    page_size: 100,
  };
  const { data: logs, isLoading } = useEntities<AuditLog>(["audit", params], "/audit/logs/", params);

  return (
    <div className="space-y-6">
      <PageHeader title="Journal d'audit" subtitle="Traçabilité de toutes les actions sensibles" icon={ScrollText} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={module} onChange={(e) => setModule(e.target.value)} className="w-44">
          <option value="">Tous les modules</option>
          <option value="accounts">IAM</option>
          <option value="workers">Ouvriers</option>
          <option value="departments">Départements</option>
          <option value="treasury">Trésorerie</option>
        </Select>
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-44">
          <option value="">Toutes les actions</option>
          <option value="create">Création</option>
          <option value="update">Modification</option>
          <option value="delete">Suppression</option>
          <option value="login">Connexion</option>
          <option value="logout">Déconnexion</option>
          <option value="custom">Action</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !logs || logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucune entrée" description="Le journal est vide pour ce filtre." />
      ) : (
        <div className="relative space-y-2 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
          {logs.map((log, i) => {
            const meta = ACTION_META[log.action] || ACTION_META.custom;
            const hasChanges = log.changes && Object.keys(log.changes).length > 0;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4) }}
                className="relative flex gap-3 pl-1"
              >
                <div className={cn("z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-background", meta.cls)}>
                  <meta.icon className="h-4 w-4" />
                </div>
                <div className="card flex-1 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{log.actor_name}</span>
                      <span className="text-sm text-muted-foreground">{log.action_display.toLowerCase()}</span>
                      <span className="text-sm text-muted-foreground">{log.object_repr}</span>
                      {log.module && <Badge tone="slate">{MODULE_LABELS[log.module] || log.module}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground" title={formatDateTime(log.timestamp)}>
                      {relativeTime(log.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground/70">
                    {log.ip_address && <span>IP : {log.ip_address}</span>}
                    {hasChanges && (
                      <button
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        className="flex items-center gap-1 text-brand-600 dark:text-brand-300 hover:text-brand-500"
                      >
                        <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded === log.id && "rotate-180")} />
                        Détails
                      </button>
                    )}
                  </div>
                  {expanded === log.id && hasChanges && renderChanges(log.changes as Record<string, unknown>)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
