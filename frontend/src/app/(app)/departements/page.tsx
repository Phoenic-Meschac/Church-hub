"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Plus, Pencil, Trash2, Users, Briefcase, Settings2, X } from "lucide-react";
import type { Department, Worker, DepartmentFunction } from "@/lib/types";
import { useEntities, useEntityMutations } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader, LoadingBlock, EmptyState, Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Form = Partial<Department>;
const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

export default function DepartementsPage() {
  const canManage = useAuthStore((s) => s.hasPerm("departments.manage"));
  const { data: departments, isLoading } = useEntities<Department>(["departments"], "/departments/");
  const { data: workers } = useEntities<Worker>(["workers"], "/workers/");
  const deptMut = useEntityMutations("/departments/", [["departments"], ["dashboard"]], {
    created: "Département créé.",
    updated: "Département mis à jour.",
    deleted: "Département supprimé.",
  });
  const fnMut = useEntityMutations("/functions/", [["functions"], ["departments"]], {
    created: "Fonction ajoutée.",
    deleted: "Fonction supprimée.",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<Form>({ color: COLORS[0] });
  const [toDelete, setToDelete] = useState<Department | null>(null);
  const [fnDept, setFnDept] = useState<Department | null>(null);
  const [newFn, setNewFn] = useState("");

  const set = (k: keyof Form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ color: COLORS[0] });
    setOpen(true);
  };
  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ ...d });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: form.name,
      code: form.code,
      color: form.color,
      meeting_day: form.meeting_day || "",
      description: form.description || "",
      leader: form.leader || null,
    };
    try {
      if (editing) await deptMut.update.mutateAsync({ id: editing.id, ...payload });
      else await deptMut.create.mutateAsync(payload);
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  const addFunction = async () => {
    if (!fnDept || !newFn.trim()) return;
    await fnMut.create.mutateAsync({ department: fnDept.id, name: newFn.trim() });
    setNewFn("");
  };

  const currentFns =
    fnDept && departments ? departments.find((d) => d.id === fnDept.id)?.functions ?? [] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Départements"
        subtitle="Ministères, équipes et fonctions associées"
        icon={Network}
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nouveau département
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : !departments || departments.length === 0 ? (
        <EmptyState icon={Network} title="Aucun département" description="Créez votre premier département." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card card-hover relative overflow-hidden p-5"
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: d.color }}
              />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground"
                    style={{ background: `${d.color}33`, color: d.color }}
                  >
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{d.name}</h3>
                    <Badge tone="slate">{d.code}</Badge>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setToDelete(d)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {d.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{d.description}</p>}

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {d.worker_count} ouvriers
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> {d.function_count} fonctions
                </span>
              </div>

              {d.leader_name && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Responsable : <span className="text-muted-foreground">{d.leader_name}</span>
                </p>
              )}

              {d.functions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.functions.slice(0, 5).map((f) => (
                    <span key={f.id} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}

              {canManage && (
                <button
                  onClick={() => setFnDept(d)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-300 hover:text-brand-500"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Gérer les fonctions
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Department modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier le département" : "Nouveau département"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} loading={deptMut.create.isPending || deptMut.update.isPending}>
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
          </div>
          <Field label="Couleur">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => set("color", c)}
                  className={`h-8 w-8 rounded-lg ring-2 transition ${form.color === c ? "ring-foreground" : "ring-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Responsable">
              <Select value={form.leader ?? ""} onChange={(e) => set("leader", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Aucun —</option>
                {workers?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Jour de réunion">
              <Input value={form.meeting_day || ""} onChange={(e) => set("meeting_day", e.target.value)} placeholder="ex : Samedi" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </form>
      </Modal>

      {/* Functions modal */}
      <Modal open={!!fnDept} onClose={() => setFnDept(null)} title={`Fonctions — ${fnDept?.name ?? ""}`}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nouvelle fonction…"
              value={newFn}
              onChange={(e) => setNewFn(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFunction())}
            />
            <Button onClick={addFunction} loading={fnMut.create.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {currentFns.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Aucune fonction définie.</p>
          ) : (
            <div className="space-y-2">
              {currentFns.map((f: DepartmentFunction) => (
                <div key={f.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <div>
                    <p className="text-sm text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.worker_count} ouvrier(s)</p>
                  </div>
                  <button
                    onClick={() => fnMut.remove.mutate(f.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={deptMut.remove.isPending}
        message={`Supprimer le département ${toDelete?.name} ?`}
        onConfirm={async () => {
          if (toDelete) await deptMut.remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
