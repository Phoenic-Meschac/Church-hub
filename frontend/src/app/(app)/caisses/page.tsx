"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Landmark, Plus, Pencil, Trash2, Users2, X } from "lucide-react";
import type { Caisse, Worker, CaisseAssignment, AppUser } from "@/lib/types";
import { useEntities, useEntityMutations } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PageHeader, LoadingBlock, EmptyState, Badge, Avatar } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatMoney } from "@/lib/format";

const TYPE_TONE: Record<string, "brand" | "violet" | "sky" | "amber" | "green"> = {
  principale: "brand",
  secondaire: "sky",
  projet: "violet",
  mission: "amber",
  departement: "green",
};

export default function CaissesPage() {
  const canManage = useAuthStore((s) => s.hasPerm("treasury.caisse_manage"));
  const canPickUser = useAuthStore((s) => s.hasPerm("iam.view"));
  const { data: caisses, isLoading } = useEntities<Caisse>(["caisses"], "/caisses/");
  const { data: workers } = useEntities<Worker>(["workers"], "/workers/", { page_size: 500 });
  const { data: users } = useQuery<AppUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const r = await api.get("/iam/users/");
      return r.data.results ?? r.data;
    },
    enabled: canPickUser,
  });

  const mut = useEntityMutations("/caisses/", [["caisses"], ["dashboard"]], {
    created: "Caisse créée.",
    updated: "Caisse mise à jour.",
    deleted: "Caisse supprimée.",
  });
  const assignMut = useEntityMutations("/caisse-assignments/", [["caisses"]], {
    created: "Assignation ajoutée.",
    deleted: "Assignation retirée.",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Caisse | null>(null);
  const [form, setForm] = useState<Partial<Caisse>>({ type: "principale", currency: "CDF" });
  const [toDelete, setToDelete] = useState<Caisse | null>(null);

  const [assignCaisse, setAssignCaisse] = useState<Caisse | null>(null);
  const [assignType, setAssignType] = useState<"worker" | "user">("worker");
  const [assignWorker, setAssignWorker] = useState("");
  const [assignUser, setAssignUser] = useState("");
  const [assignRole, setAssignRole] = useState("caissier");

  const set = (k: keyof Caisse, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ type: "principale", currency: "CDF", opening_balance: "0" });
    setOpen(true);
  };
  const openEdit = (c: Caisse) => {
    setEditing(c);
    setForm({ ...c });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name,
      code: form.code,
      type: form.type,
      currency: form.currency,
      opening_balance: form.opening_balance || "0",
      description: form.description || "",
      is_active: form.is_active ?? true,
    };
    try {
      if (editing) await mut.update.mutateAsync({ id: editing.id, ...payload });
      else await mut.create.mutateAsync(payload);
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  const addAssignment = async () => {
    if (!assignCaisse) return;
    if (assignType === "worker" && !assignWorker) return;
    if (assignType === "user" && !assignUser) return;
    await assignMut.create.mutateAsync({
      caisse: assignCaisse.id,
      role: assignRole,
      ...(assignType === "worker"
        ? { worker: Number(assignWorker) }
        : { user: Number(assignUser) }),
    });
    setAssignWorker("");
    setAssignUser("");
  };

  const currentAssignments =
    assignCaisse && caisses ? caisses.find((c) => c.id === assignCaisse.id)?.assignments ?? [] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caisses"
        subtitle="Création, soldes et assignation des caisses"
        icon={Landmark}
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nouvelle caisse
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : !caisses || caisses.length === 0 ? (
        <EmptyState icon={Landmark} title="Aucune caisse" description="Créez votre première caisse." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {caisses.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card card-hover relative overflow-hidden p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-brand-600 ring-1 ring-border dark:text-brand-300">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge tone={TYPE_TONE[c.type] || "slate"}>{c.type_display}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setToDelete(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Solde actuel</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatMoney(c.current_balance, c.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{c.transaction_count} transaction(s)</p>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Affectations</p>
                  {canManage && (
                    <button
                      onClick={() => setAssignCaisse(c)}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-500 dark:text-brand-300"
                    >
                      <Users2 className="h-3.5 w-3.5" /> Gérer
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.assignments.length === 0 ? (
                    <span className="text-xs text-muted-foreground/70">Aucune affectation</span>
                  ) : (
                    c.assignments.map((a) => (
                      <div key={a.id} className="flex items-center gap-1.5 rounded-full bg-muted py-1 pl-1 pr-2.5">
                        <Avatar name={a.assignee_name} size={22} />
                        <span className="text-xs text-foreground">{a.assignee_name}</span>
                        <span className="text-[10px] text-muted-foreground">· {a.role_display}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Caisse modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la caisse" : "Nouvelle caisse"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} loading={mut.create.isPending || mut.update.isPending}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom" required>
              <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Code" required>
              <Input value={form.code || ""} onChange={(e) => set("code", e.target.value.toUpperCase())} required />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="principale">Caisse principale</option>
                <option value="secondaire">Caisse secondaire</option>
                <option value="projet">Projet</option>
                <option value="mission">Mission</option>
                <option value="departement">Département</option>
              </Select>
            </Field>
            <Field label="Devise">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </Field>
            <Field label="Solde d'ouverture">
              <Input
                type="number"
                step="0.01"
                value={form.opening_balance ?? "0"}
                onChange={(e) => set("opening_balance", e.target.value)}
                disabled={!!editing}
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </form>
      </Modal>

      {/* Assignments modal */}
      <Modal open={!!assignCaisse} onClose={() => setAssignCaisse(null)} title={`Affectations — ${assignCaisse?.name ?? ""}`}>
        <div className="space-y-4">
          {canPickUser && (
            <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 text-sm">
              <button
                onClick={() => setAssignType("worker")}
                className={cn(
                  "flex-1 rounded-md py-1.5 transition",
                  assignType === "worker" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Ouvrier
              </button>
              <button
                onClick={() => setAssignType("user")}
                className={cn(
                  "flex-1 rounded-md py-1.5 transition",
                  assignType === "user" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Utilisateur
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {assignType === "worker" ? (
              <Select value={assignWorker} onChange={(e) => setAssignWorker(e.target.value)} className="flex-1">
                <option value="">Choisir un ouvrier…</option>
                {workers?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name}
                  </option>
                ))}
              </Select>
            ) : (
              <Select value={assignUser} onChange={(e) => setAssignUser(e.target.value)} className="flex-1">
                <option value="">Choisir un utilisateur…</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </Select>
            )}
            <Select value={assignRole} onChange={(e) => setAssignRole(e.target.value)} className="w-36">
              <option value="caissier">Caissier</option>
              <option value="responsable">Responsable</option>
              <option value="auditeur">Auditeur</option>
            </Select>
            <Button onClick={addAssignment} loading={assignMut.create.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {currentAssignments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Aucune affectation.</p>
            ) : (
              currentAssignments.map((a: CaisseAssignment) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.assignee_name} size={30} />
                    <div>
                      <p className="text-sm text-foreground">{a.assignee_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.role_display}
                        {a.user ? " · Utilisateur" : " · Ouvrier"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => assignMut.remove.mutate(a.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={mut.remove.isPending}
        message={`Supprimer la caisse ${toDelete?.name} ? Toutes ses transactions seront perdues.`}
        onConfirm={async () => {
          if (toDelete) await mut.remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
