"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ListTodo, Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import type { Task, Worker, Department } from "@/lib/types";
import { useEntities, useEntityMutations } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader, LoadingBlock, Avatar, Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/format";

const COLUMNS = [
  { key: "todo", label: "À faire", accent: "border-slate-400/30" },
  { key: "in_progress", label: "En cours", accent: "border-sky-400/30" },
  { key: "done", label: "Terminées", accent: "border-emerald-400/30" },
];
const PRIORITY_TONE: Record<string, "rose" | "amber" | "slate"> = {
  high: "rose",
  medium: "amber",
  low: "slate",
};

export default function TachesPage() {
  const canManage = useAuthStore((s) => s.hasPerm("workers.manage"));
  const { data: tasks, isLoading } = useEntities<Task>(["tasks"], "/tasks/", { page_size: 200 });
  const { data: workers } = useEntities<Worker>(["workers"], "/workers/", { page_size: 500 });
  const { data: departments } = useEntities<Department>(["departments"], "/departments/");
  const mut = useEntityMutations("/tasks/", [["tasks"], ["dashboard"]], {
    created: "Tâche créée.",
    updated: "Tâche mise à jour.",
    deleted: "Tâche supprimée.",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Partial<Task>>({ priority: "medium", status: "todo" });
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = { todo: [], in_progress: [], done: [] };
    (tasks || []).forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  const set = (k: keyof Task, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm({ priority: "medium", status: "todo" });
    setOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({ ...t });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || "",
      worker: form.worker || null,
      department: form.department || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
    };
    try {
      if (editing) await mut.update.mutateAsync({ id: editing.id, ...payload });
      else await mut.create.mutateAsync(payload);
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tâches"
        subtitle="Tâches spécifiques assignées aux ouvriers"
        icon={ListTodo}
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nouvelle tâche
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`rounded-2xl border-t-2 ${col.accent} bg-muted/40 p-3`}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {grouped[col.key]?.length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[col.key]?.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{t.title}</p>
                      <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority_display}</Badge>
                    </div>
                    {t.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.worker_name ? (
                          <>
                            <Avatar name={t.worker_name} size={24} />
                            <span className="text-xs text-muted-foreground">{t.worker_name}</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">Non assignée</span>
                        )}
                      </div>
                      {t.due_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarClock className="h-3.5 w-3.5" /> {formatDate(t.due_date)}
                        </span>
                      )}
                    </div>
                    {canManage && (
                      <div className="mt-2 flex justify-end gap-1 border-t border-border pt-2">
                        <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setToDelete(t)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
                {(!grouped[col.key] || grouped[col.key].length === 0) && (
                  <p className="py-6 text-center text-xs text-muted-foreground/70">Aucune tâche</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la tâche" : "Nouvelle tâche"}
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
          <Field label="Titre" required>
            <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} required />
          </Field>
          <Field label="Description">
            <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigné à">
              <Select value={form.worker ?? ""} onChange={(e) => set("worker", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Personne —</option>
                {workers?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Département">
              <Select value={form.department ?? ""} onChange={(e) => set("department", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Aucun —</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priorité">
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </Select>
            </Field>
            <Field label="Statut">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminée</option>
              </Select>
            </Field>
          </div>
          <Field label="Échéance">
            <Input type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={mut.remove.isPending}
        message={`Supprimer la tâche « ${toDelete?.title} » ?`}
        onConfirm={async () => {
          if (toDelete) await mut.remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
