"use client";

import { useMemo, useState } from "react";
import { Users, Plus, Search, Pencil, Trash2, LayoutGrid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Worker, Department, DepartmentFunction } from "@/lib/types";
import { useEntities, useEntityMutations } from "@/lib/hooks";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MemberCard } from "@/components/workers/MemberCard";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader, LoadingBlock, EmptyState, Avatar, StatusBadge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

type FormState = Partial<Worker>;
const EMPTY: FormState = { first_name: "", last_name: "", gender: "M", status: "active" };

export default function OuvriersPage() {
  const canManage = useAuthStore((s) => s.hasPerm("workers.manage"));
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"table" | "cards">("table");

  const params = { search: search || undefined, department: dept || undefined, status: status || undefined };
  const { data: workers, isLoading } = useEntities<Worker>(["workers", params], "/workers/", params);
  const { data: departments } = useEntities<Department>(["departments"], "/departments/");
  const { data: functions } = useEntities<DepartmentFunction>(["functions"], "/functions/");
  const { data: profile } = useQuery({
    queryKey: ["church-profile"],
    queryFn: async () => (await api.get("/church-profile/")).data,
  });
  const churchName = (profile as { name?: string } | undefined)?.name ?? "ChurchHub";
  const { create, update, remove } = useEntityMutations("/workers/", [["workers"], ["dashboard"]], {
    created: "Ouvrier ajouté.",
    updated: "Ouvrier mis à jour.",
    deleted: "Ouvrier supprimé.",
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [toDelete, setToDelete] = useState<Worker | null>(null);

  const fnOptions = useMemo(
    () => (functions || []).filter((f) => String(f.department) === String(form.department)),
    [functions, form.department]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (w: Worker) => {
    setEditing(w);
    setForm({ ...w });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      first_name: form.first_name,
      last_name: form.last_name,
      gender: form.gender || "",
      phone: form.phone || "",
      email: form.email || "",
      address: form.address || "",
      birth_date: form.birth_date || null,
      join_date: form.join_date || null,
      status: form.status,
      department: form.department || null,
      function: form.function || null,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...payload });
      else await create.mutateAsync(payload);
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  const set = (k: keyof FormState, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ouvriers"
        subtitle="Gestion des ouvriers, départements et fonctions"
        icon={Users}
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nouvel ouvrier
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un ouvrier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-48">
          <option value="">Tous les départements</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </Select>
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5">
          <button
            onClick={() => setView("table")}
            title="Vue liste"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition",
              view === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("cards")}
            title="Vue cartes"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition",
              view === "cards" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : !workers || workers.length === 0 ? (
        <EmptyState icon={Users} title="Aucun ouvrier" description="Commencez par ajouter un ouvrier." />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workers.map((w) => (
            <MemberCard
              key={w.id}
              worker={w}
              churchName={churchName}
              onClick={canManage ? () => openEdit(w) : undefined}
            />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Ouvrier</TH>
              <TH>Matricule</TH>
              <TH>Département</TH>
              <TH>Fonction</TH>
              <TH>Téléphone</TH>
              <TH>Statut</TH>
              {canManage && <TH className="text-right">Actions</TH>}
            </TR>
          </THead>
          <TBody>
            {workers.map((w) => (
              <TR key={w.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={w.full_name} src={w.photo} size={36} />
                    <span className="font-medium text-foreground">{w.full_name}</span>
                  </div>
                </TD>
                <TD className="font-mono text-xs text-muted-foreground">{w.matricule}</TD>
                <TD className="text-muted-foreground">{w.department_name || "—"}</TD>
                <TD className="text-muted-foreground">{w.function_name || "—"}</TD>
                <TD className="text-muted-foreground">{w.phone || "—"}</TD>
                <TD>
                  <StatusBadge status={w.status} label={w.status_display} />
                </TD>
                {canManage && (
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(w)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setToDelete(w)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300"
                      >
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
        title={editing ? "Modifier l'ouvrier" : "Nouvel ouvrier"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom" required>
            <Input value={form.first_name || ""} onChange={(e) => set("first_name", e.target.value)} required />
          </Field>
          <Field label="Nom" required>
            <Input value={form.last_name || ""} onChange={(e) => set("last_name", e.target.value)} required />
          </Field>
          <Field label="Genre">
            <Select value={form.gender || ""} onChange={(e) => set("gender", e.target.value)}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={form.status || "active"} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </Select>
          </Field>
          <Field label="Téléphone">
            <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Département">
            <Select
              value={form.department ?? ""}
              onChange={(e) => {
                set("department", e.target.value ? Number(e.target.value) : null);
                set("function", null);
              }}
            >
              <option value="">— Aucun —</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fonction">
            <Select
              value={form.function ?? ""}
              onChange={(e) => set("function", e.target.value ? Number(e.target.value) : null)}
              disabled={!form.department}
            >
              <option value="">— Aucune —</option>
              {fnOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date de naissance">
            <Input type="date" value={form.birth_date || ""} onChange={(e) => set("birth_date", e.target.value)} />
          </Field>
          <Field label="Date d'adhésion">
            <Input type="date" value={form.join_date || ""} onChange={(e) => set("join_date", e.target.value)} />
          </Field>
          <Field label="Adresse" className="sm:col-span-2">
            <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={remove.isPending}
        message={`Supprimer ${toDelete?.full_name} ? Cette action est irréversible.`}
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
