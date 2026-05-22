"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Network,
  Wallet,
  TrendingUp,
  HandCoins,
  Gift,
  Receipt,
  ListTodo,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { Card, StatCard } from "@/components/ui/Card";
import { BarChart, DonutChart, ProgressRing } from "@/components/ui/charts";
import { PageHeader, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatMoney, monthLabel, formatDate } from "@/lib/format";

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard/stats/")).data,
  });

  if (isLoading || !data) return <LoadingBlock label="Chargement du tableau de bord…" />;

  const currency = data.caisses.balances[0]?.currency || "CDF";
  const totalBalance = data.caisses.balances.reduce((s, b) => s + Number(b.total), 0);
  const series = data.monthly_series.map((m) => ({
    label: monthLabel(m.month),
    in: Number(m.in),
    out: Number(m.out),
  }));
  const offerings = data.offerings_by_type.map((o) => ({
    label: o.offering_type__name || "Autre",
    value: Number(o.total),
  }));

  const breakdown = [
    { label: "Dîmes", value: data.finance_month.tithes, icon: HandCoins, tone: "text-emerald-600 dark:text-emerald-300" },
    { label: "Offrandes", value: data.finance_month.offerings, icon: Gift, tone: "text-violet-600 dark:text-violet-300" },
    { label: "Dépenses", value: data.finance_month.expenses, icon: Receipt, tone: "text-rose-600 dark:text-rose-300" },
  ];
  const maxBreak = Math.max(1, ...breakdown.map((b) => b.value));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la vie de votre église"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ouvriers actifs" value={data.workers.active} icon={Users} accent="indigo" delay={0} />
        <StatCard label="Départements" value={data.departments.total} icon={Network} accent="violet" delay={0.08} />
        <StatCard
          label="Solde total"
          value={totalBalance}
          icon={Wallet}
          accent="emerald"
          format={(n) => formatMoney(n, currency)}
          delay={0.16}
        />
        <StatCard
          label="Entrées du mois"
          value={data.finance_month.in}
          icon={TrendingUp}
          accent="sky"
          format={(n) => formatMoney(n, currency)}
          delay={0.24}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Flux financier</h3>
              <p className="text-xs text-muted-foreground">Entrées et sorties sur 6 mois</p>
            </div>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
              Net : {formatMoney(data.finance_month.net, currency)}
            </span>
          </div>
          <BarChart data={series} currency={currency} />
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Répartition des offrandes</h3>
          <DonutChart data={offerings.length ? offerings : [{ label: "Aucune", value: 0 }]} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <h3 className="mb-3 self-start font-semibold text-foreground">Taux de présence</h3>
          <ProgressRing value={data.attendance.rate} label="ce mois" />
          <p className="mt-3 text-sm text-muted-foreground">
            {data.attendance.present} présences / {data.attendance.total}
          </p>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Finances du mois</h3>
          <div className="space-y-4">
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <b.icon className={`h-4 w-4 ${b.tone}`} /> {b.label}
                  </span>
                  <span className="font-medium text-foreground">{formatMoney(b.value, currency)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    style={{ width: `${(b.value / maxBreak) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <ListTodo className="h-4 w-4 text-brand-600 dark:text-brand-300" /> Tâches
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "À faire", value: data.tasks.todo, color: "text-muted-foreground" },
              { label: "En cours", value: data.tasks.in_progress, color: "text-sky-600 dark:text-sky-300" },
              { label: "Terminées", value: data.tasks.done, color: "text-emerald-600 dark:text-emerald-300" },
            ].map((t) => (
              <div key={t.label} className="rounded-xl bg-muted p-3">
                <p className={`text-2xl font-semibold ${t.color}`}>{t.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-foreground">Dernières transactions</h3>
        {data.recent_transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune transaction récente.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Référence</TH>
                <TH>Catégorie</TH>
                <TH>Date</TH>
                <TH>Statut</TH>
                <TH className="text-right">Montant</TH>
              </TR>
            </THead>
            <TBody>
              {data.recent_transactions.map((t) => (
                <TR key={t.id}>
                  <TD className="font-mono text-xs text-muted-foreground">{t.reference}</TD>
                  <TD>{t.category_display}</TD>
                  <TD className="text-muted-foreground">{formatDate(t.date)}</TD>
                  <TD>
                    <StatusBadge status={t.status} label={t.status_display} />
                  </TD>
                  <TD
                    className={`text-right font-medium ${
                      t.direction === "in" ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"
                    }`}
                  >
                    {t.direction === "in" ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
