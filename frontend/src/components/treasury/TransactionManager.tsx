"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Check, Ban, TrendingUp, TrendingDown, Wallet, Hash } from "lucide-react";
import type { Transaction, Caisse, OfferingType, Worker } from "@/lib/types";
import { useEntities, useEntityMutations, apiError } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { PageHeader, LoadingBlock, EmptyState, StatusBadge } from "@/components/ui/feedback";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatMoney, formatDate } from "@/lib/format";

const IN_CATEGORIES = ["tithe", "offering", "donation"];

function SummaryTile({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </Card>
  );
}

export function TransactionManager({
  title,
  subtitle,
  icon,
  category,
  extraActions,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  category?: "tithe" | "offering" | "expense" | "donation";
  extraActions?: React.ReactNode;
}) {
  const lockCategory = !!category;
  const canManage = useAuthStore((s) => s.hasPerm("treasury.manage"));
  const canApprove = useAuthStore((s) => s.hasPerm("treasury.expense_approve"));
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [caisseFilter, setCaisseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const params = {
    category: category || undefined,
    caisse: caisseFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    page_size: 500,
  };
  const { data: txs, isLoading } = useEntities<Transaction>(["transactions", category, params], "/transactions/", params);
  const { data: caisses } = useEntities<Caisse>(["caisses"], "/caisses/");
  const { data: offeringTypes } = useEntities<OfferingType>(["offering-types"], "/offering-types/");
  const { data: workers } = useEntities<Worker>(["workers"], "/workers/", { page_size: 500 });

  const mut = useEntityMutations("/transactions/", [["transactions"], ["caisses"], ["dashboard"]], {
    created: "Transaction enregistrée.",
    updated: "Transaction modifiée.",
    deleted: "Transaction supprimée.",
  });

  const action = useMutation({
    mutationFn: ({ id, act }: { id: number; act: "approve" | "cancel" }) =>
      api.post(`/transactions/${id}/${act}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["caisses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Statut mis à jour.");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<Partial<Transaction>>({});
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const set = (k: keyof Transaction, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const summary = useMemo(() => {
    const list = txs || [];
    const validated = list.filter((t) => t.status === "validated");
    const sumIn = validated.filter((t) => t.direction === "in").reduce((s, t) => s + Number(t.amount), 0);
    const sumOut = validated.filter((t) => t.direction === "out").reduce((s, t) => s + Number(t.amount), 0);
    return { sumIn, sumOut, net: sumIn - sumOut, count: list.length };
  }, [txs]);

  const currency = caisses?.[0]?.currency || "CDF";

  const openCreate = () => {
    setEditing(null);
    setForm({
      category: category || "offering",
      date: new Date().toISOString().slice(0, 10),
      direction: category && !IN_CATEGORIES.includes(category) ? "out" : "in",
    });
    setOpen(true);
  };
  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({ ...t });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = (form.category as string) || "other";
    const payload: Record<string, unknown> = {
      caisse: form.caisse,
      category: cat,
      amount: form.amount,
      date: form.date,
      label: form.label || "",
      offering_type: cat === "offering" ? form.offering_type || null : null,
      contributor_worker: IN_CATEGORIES.includes(cat) ? form.contributor_worker || null : null,
      contributor_name: IN_CATEGORIES.includes(cat) ? form.contributor_name || "" : "",
    };
    if (!IN_CATEGORIES.includes(cat) && cat !== "expense") payload.direction = form.direction || "in";
    try {
      if (editing) await mut.update.mutateAsync({ id: editing.id, ...payload });
      else await mut.create.mutateAsync(payload);
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  const formCat = (form.category as string) || "other";
  const showDirection = !lockCategory && !IN_CATEGORIES.includes(formCat) && formCat !== "expense";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={
          <div className="flex items-center gap-2">
            {extraActions}
            {canManage && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Nouvelle écriture
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total entrées" value={formatMoney(summary.sumIn, currency)} icon={TrendingUp} color="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" />
        <SummaryTile label="Total sorties" value={formatMoney(summary.sumOut, currency)} icon={TrendingDown} color="bg-rose-500/15 text-rose-600 dark:text-rose-300" />
        <SummaryTile label="Solde net" value={formatMoney(summary.net, currency)} icon={Wallet} color="bg-indigo-500/15 text-indigo-600 dark:text-indigo-300" />
        <SummaryTile label="Écritures" value={String(summary.count)} icon={Hash} color="bg-violet-500/15 text-violet-600 dark:text-violet-300" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={caisseFilter} onChange={(e) => setCaisseFilter(e.target.value)} className="w-48">
          <option value="">Toutes les caisses</option>
          {caisses?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">Tous statuts</option>
          <option value="validated">Validée</option>
          <option value="pending">En attente</option>
          <option value="cancelled">Annulée</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !txs || txs.length === 0 ? (
        <EmptyState icon={icon} title="Aucune écriture" description="Aucune transaction pour ce filtre." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Référence</TH>
              <TH>Date</TH>
              <TH>Caisse</TH>
              {!lockCategory && <TH>Catégorie</TH>}
              <TH>Libellé / Contributeur</TH>
              <TH>Statut</TH>
              <TH className="text-right">Montant</TH>
              {canManage && <TH className="text-right">Actions</TH>}
            </TR>
          </THead>
          <TBody>
            {txs.map((t) => (
              <TR key={t.id}>
                <TD className="font-mono text-xs text-muted-foreground">{t.reference}</TD>
                <TD className="text-muted-foreground">{formatDate(t.date)}</TD>
                <TD className="text-muted-foreground">{t.caisse_name}</TD>
                {!lockCategory && (
                  <TD>
                    <span className="text-muted-foreground">{t.category_display}</span>
                  </TD>
                )}
                <TD className="text-muted-foreground">
                  {t.label || t.offering_type_name || "—"}
                  {t.contributor_display !== "—" && (
                    <span className="block text-xs text-muted-foreground">{t.contributor_display}</span>
                  )}
                </TD>
                <TD>
                  <StatusBadge status={t.status} label={t.status_display} />
                </TD>
                <TD className={`text-right font-medium ${t.direction === "in" ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                  {t.direction === "in" ? "+" : "−"}
                  {formatMoney(t.amount, t.currency)}
                </TD>
                {canManage && (
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      {canApprove && t.status === "pending" && (
                        <button
                          title="Valider"
                          onClick={() => action.mutate({ id: t.id, act: "approve" })}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-300"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {t.status !== "cancelled" && (
                        <button
                          title="Annuler"
                          onClick={() => action.mutate({ id: t.id, act: "cancel" })}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-amber-500/15 hover:text-amber-300"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(t)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setToDelete(t)} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier l'écriture" : "Nouvelle écriture"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} loading={mut.create.isPending || mut.update.isPending}>
              {editing ? "Enregistrer" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Caisse" required>
              <Select value={form.caisse ?? ""} onChange={(e) => set("caisse", Number(e.target.value))} required>
                <option value="">— Choisir —</option>
                {caisses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Catégorie">
              <Select value={formCat} onChange={(e) => set("category", e.target.value)} disabled={lockCategory}>
                <option value="tithe">Dîme</option>
                <option value="offering">Offrande</option>
                <option value="donation">Don</option>
                <option value="expense">Dépense</option>
                <option value="transfer">Transfert</option>
                <option value="other">Autre</option>
              </Select>
            </Field>
            <Field label="Montant" required>
              <Input type="number" min="0" step="0.01" value={form.amount ?? ""} onChange={(e) => set("amount", e.target.value)} required />
            </Field>
            <Field label="Date" required>
              <Input type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} required />
            </Field>
            {showDirection && (
              <Field label="Sens">
                <Select value={form.direction || "in"} onChange={(e) => set("direction", e.target.value)}>
                  <option value="in">Entrée</option>
                  <option value="out">Sortie</option>
                </Select>
              </Field>
            )}
            {formCat === "offering" && (
              <Field label="Type d'offrande">
                <Select value={form.offering_type ?? ""} onChange={(e) => set("offering_type", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Aucun —</option>
                  {offeringTypes?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          {IN_CATEGORIES.includes(formCat) && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contributeur (ouvrier)">
                <Select value={form.contributor_worker ?? ""} onChange={(e) => set("contributor_worker", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Aucun —</option>
                  {workers?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ou nom libre">
                <Input value={form.contributor_name || ""} onChange={(e) => set("contributor_name", e.target.value)} placeholder="Nom du contributeur" />
              </Field>
            </div>
          )}

          <Field label="Libellé">
            <Textarea value={form.label || ""} onChange={(e) => set("label", e.target.value)} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={mut.remove.isPending}
        message={`Supprimer l'écriture ${toDelete?.reference} ?`}
        onConfirm={async () => {
          if (toDelete) await mut.remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
