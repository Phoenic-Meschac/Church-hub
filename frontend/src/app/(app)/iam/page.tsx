"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Plus, Pencil, Trash2, UserCog, KeyRound, Lock } from "lucide-react";
import type { AppUser, Role, Permission } from "@/lib/types";
import { useEntities, useEntityMutations } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader, LoadingBlock, EmptyState, Avatar, Badge, StatusBadge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  iam: "Utilisateurs & accès",
  departments: "Départements",
  workers: "Ouvriers",
  treasury: "Trésorerie",
  audit: "Audit",
};

export default function IamPage() {
  const canManage = useAuthStore((s) => s.hasPerm("iam.manage"));
  const [tab, setTab] = useState<"users" | "roles">("users");

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs & accès" subtitle="Gestion des comptes, rôles et permissions (IAM)" icon={ShieldCheck} />

      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {[
          { key: "users", label: "Utilisateurs", icon: UserCog },
          { key: "roles", label: "Rôles & permissions", icon: KeyRound },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "users" | "roles")}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === t.key && (
              <motion.span layoutId="iam-tab" className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/20 ring-1 ring-border" />
            )}
            <t.icon className="relative h-4 w-4" />
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "users" ? <UsersTab canManage={canManage} /> : <RolesTab canManage={canManage} />}
    </div>
  );
}

/* ----------------------------------------------------------------- Users */
function UsersTab({ canManage }: { canManage: boolean }) {
  const { data: users, isLoading } = useEntities<AppUser>(["users"], "/iam/users/");
  const { data: roles } = useEntities<Role>(["roles"], "/iam/roles/");
  const mut = useEntityMutations("/iam/users/", [["users"]], {
    created: "Utilisateur créé.",
    updated: "Utilisateur mis à jour.",
    deleted: "Utilisateur supprimé.",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<Partial<AppUser> & { password?: string }>({ roles: [], is_active: true });
  const [toDelete, setToDelete] = useState<AppUser | null>(null);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const toggleRole = (id: number) =>
    setForm((f) => {
      const cur = f.roles || [];
      return { ...f, roles: cur.includes(id) ? cur.filter((r) => r !== id) : [...cur, id] };
    });

  const openCreate = () => {
    setEditing(null);
    setForm({ roles: [], is_active: true });
    setOpen(true);
  };
  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({ ...u, password: "" });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      email: form.email,
      first_name: form.first_name || "",
      last_name: form.last_name || "",
      phone: form.phone || "",
      roles: form.roles || [],
      is_active: form.is_active ?? true,
      is_superuser: form.is_superuser ?? false,
    };
    if (form.password) payload.password = form.password;
    try {
      if (editing) await mut.update.mutateAsync({ id: editing.id, ...payload });
      else await mut.create.mutateAsync(payload);
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouvel utilisateur
          </Button>
        </div>
      )}

      {!users || users.length === 0 ? (
        <EmptyState icon={UserCog} title="Aucun utilisateur" />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Utilisateur</TH>
              <TH>Email</TH>
              <TH>Rôles</TH>
              <TH>Statut</TH>
              {canManage && <TH className="text-right">Actions</TH>}
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name || u.email} src={u.photo} size={36} />
                    <span className="font-medium text-foreground">{u.full_name || "—"}</span>
                    {u.is_superuser && <Badge tone="violet">Admin</Badge>}
                  </div>
                </TD>
                <TD className="text-muted-foreground">{u.email}</TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {u.role_names.length ? (
                      u.role_names.map((r) => (
                        <Badge key={r} tone="brand">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>
                </TD>
                <TD>
                  <StatusBadge status={u.is_active ? "active" : "inactive"} label={u.is_active ? "Actif" : "Inactif"} />
                </TD>
                {canManage && (
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setToDelete(u)} className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300">
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
        title={editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        size="lg"
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
            <Field label="Prénom">
              <Input value={form.first_name || ""} onChange={(e) => set("first_name", e.target.value)} />
            </Field>
            <Field label="Nom">
              <Input value={form.last_name || ""} onChange={(e) => set("last_name", e.target.value)} />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} required />
            </Field>
            <Field label="Téléphone">
              <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label={editing ? "Nouveau mot de passe" : "Mot de passe"} hint={editing ? "Laisser vide pour ne pas changer" : undefined}>
              <Input type="password" value={form.password || ""} onChange={(e) => set("password", e.target.value)} />
            </Field>
          </div>

          <Field label="Rôles">
            <div className="flex flex-wrap gap-2">
              {roles?.map((r) => {
                const active = (form.roles || []).includes(r.id);
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition",
                      active
                        ? "border-brand-400/40 bg-brand-500/20 text-foreground"
                        : "border-white/10 bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-indigo-500" />
              Compte actif
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_superuser ?? false} onChange={(e) => set("is_superuser", e.target.checked)} className="h-4 w-4 accent-indigo-500" />
              Super-administrateur
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={mut.remove.isPending}
        message={`Supprimer le compte ${toDelete?.email} ?`}
        onConfirm={async () => {
          if (toDelete) await mut.remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Roles */
function RolesTab({ canManage }: { canManage: boolean }) {
  const { data: roles, isLoading } = useEntities<Role>(["roles"], "/iam/roles/");
  const { data: permissions } = useEntities<Permission>(["permissions"], "/iam/permissions/");
  const mut = useEntityMutations("/iam/roles/", [["roles"]], {
    created: "Rôle créé.",
    updated: "Rôle mis à jour.",
    deleted: "Rôle supprimé.",
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; permissions: number[] }>({
    name: "",
    description: "",
    permissions: [],
  });
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, Permission[]> = {};
    (permissions || []).forEach((p) => {
      (g[p.module] ||= []).push(p);
    });
    return g;
  }, [permissions]);

  const togglePerm = (id: number) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id) ? f.permissions.filter((p) => p !== id) : [...f.permissions, id],
    }));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", permissions: [] });
    setOpen(true);
  };
  const openEdit = (r: Role) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description, permissions: [...r.permissions] });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await mut.update.mutateAsync({ id: editing.id, ...form });
      else await mut.create.mutateAsync({ ...form });
      setOpen(false);
    } catch {
      /* toasted */
    }
  };

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau rôle
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles?.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="card card-hover p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-brand-600 dark:text-brand-300 ring-1 ring-border">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{r.name}</h3>
                  {r.is_system && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Système
                    </span>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!r.is_system && (
                    <button onClick={() => setToDelete(r)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {r.description && <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{r.permissions.length} permission(s)</span>
              <span>{r.user_count} utilisateur(s)</span>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Modifier le rôle « ${editing.name} »` : "Nouveau rôle"}
        size="lg"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom du rôle" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required disabled={editing?.is_system} />
            </Field>
            <Field label="Description">
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Permissions</p>
            {Object.entries(grouped).map(([module, perms]) => (
              <div key={module} className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {MODULE_LABELS[module] || module}
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {perms.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p.id)}
                        onChange={() => togglePerm(p.id)}
                        className="h-4 w-4 accent-indigo-500"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={mut.remove.isPending}
        message={`Supprimer le rôle ${toDelete?.name} ?`}
        onConfirm={async () => {
          if (toDelete) await mut.remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
