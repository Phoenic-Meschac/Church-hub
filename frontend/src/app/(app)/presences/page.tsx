"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Plus, Save, CheckCheck } from "lucide-react";
import type { ChurchEvent, Worker, Attendance, Department } from "@/lib/types";
import { useEntities, useEntityMutations, apiError } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { PageHeader, LoadingBlock, EmptyState, Avatar, Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

const STATUSES = [
  { value: "present", label: "Présent", cls: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-emerald-400/30" },
  { value: "late", label: "Retard", cls: "bg-amber-500/20 text-amber-600 dark:text-amber-300 ring-amber-400/30" },
  { value: "excused", label: "Excusé", cls: "bg-violet-500/20 text-violet-600 dark:text-violet-300 ring-violet-400/30" },
  { value: "absent", label: "Absent", cls: "bg-rose-500/20 text-rose-600 dark:text-rose-300 ring-rose-400/30" },
];

export default function PresencesPage() {
  const canAttend = useAuthStore((s) => s.hasPerm("workers.attendance"));
  const qc = useQueryClient();
  const { data: events, isLoading } = useEntities<ChurchEvent>(["events"], "/events/");
  const { data: workers } = useEntities<Worker>(["workers"], "/workers/", { page_size: 500 });
  const { data: departments } = useEntities<Department>(["departments"], "/departments/");
  const eventMut = useEntityMutations("/events/", [["events"], ["dashboard"]], { created: "Événement créé." });

  const [selected, setSelected] = useState<number | null>(null);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ChurchEvent>>({ type: "culte" });

  useEffect(() => {
    if (!selected && events && events.length) setSelected(events[0].id);
  }, [events, selected]);

  const { data: existing } = useEntities<Attendance>(
    ["attendances", selected],
    "/attendances/",
    { event: selected ?? 0, page_size: 500 }
  );

  useEffect(() => {
    const map: Record<number, string> = {};
    (workers || []).forEach((w) => (map[w.id] = "present"));
    (existing || []).forEach((a) => (map[a.worker] = a.status));
    setMarks(map);
  }, [existing, workers, selected]);

  const saveBulk = useMutation({
    mutationFn: (body: unknown) => api.post("/attendances/bulk/", body),
    onSuccess: () => {
      toast.success("Présences enregistrées.");
      qc.invalidateQueries({ queryKey: ["attendances"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, excused: 0, absent: 0 };
    Object.values(marks).forEach((s) => (c[s as keyof typeof c] = (c[s as keyof typeof c] || 0) + 1));
    return c;
  }, [marks]);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await eventMut.create.mutateAsync({
        name: form.name,
        type: form.type,
        date: form.date,
        start_time: form.start_time || null,
        location: form.location || "",
        department: form.department || null,
      });
      setOpen(false);
      setForm({ type: "culte" });
      setSelected((created as ChurchEvent).id);
    } catch {
      /* toasted */
    }
  };

  const save = () => {
    if (!selected) return;
    const records = Object.entries(marks).map(([worker, status]) => ({ worker: Number(worker), status }));
    saveBulk.mutate({ event: selected, records });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Présences"
        subtitle="Suivi des présences par culte et événement"
        icon={CalendarCheck}
        actions={
          canAttend && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Nouvel événement
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : !events || events.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Aucun événement" description="Créez un événement pour saisir les présences." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Events list */}
          <div className="space-y-2 lg:col-span-1">
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelected(ev.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition",
                  selected === ev.id
                    ? "border-brand-400/40 bg-brand-500/10"
                    : "border-border bg-muted/40 hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{ev.name}</span>
                  <Badge tone="brand">{ev.type_display}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(ev.date)}</p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                  {ev.present_count}/{ev.attendance_count || workers?.length || 0} présents
                </p>
              </button>
            ))}
          </div>

          {/* Attendance panel */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <span key={s.value} className={cn("rounded-lg px-2.5 py-1 text-xs ring-1", s.cls)}>
                    {s.label} · {counts[s.value as keyof typeof counts] || 0}
                  </span>
                ))}
              </div>
              {canAttend && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const m: Record<number, string> = {};
                      (workers || []).forEach((w) => (m[w.id] = "present"));
                      setMarks(m);
                    }}
                  >
                    <CheckCheck className="h-4 w-4" /> Tout présent
                  </Button>
                  <Button size="sm" onClick={save} loading={saveBulk.isPending}>
                    <Save className="h-4 w-4" /> Enregistrer
                  </Button>
                </div>
              )}
            </div>

            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
              {(workers || []).map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={w.full_name} src={w.photo} size={34} />
                    <div>
                      <p className="text-sm text-foreground">{w.full_name}</p>
                      <p className="text-xs text-muted-foreground">{w.department_name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        disabled={!canAttend}
                        onClick={() => setMarks((m) => ({ ...m, [w.id]: s.value }))}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs ring-1 transition disabled:opacity-60",
                          marks[w.id] === s.value
                            ? s.cls
                            : "bg-muted text-muted-foreground ring-transparent hover:bg-white/10"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvel événement"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={createEvent} loading={eventMut.create.isPending}>
              Créer
            </Button>
          </>
        }
      >
        <form onSubmit={createEvent} className="space-y-4">
          <Field label="Intitulé" required>
            <Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="culte">Culte</option>
                <option value="reunion">Réunion</option>
                <option value="repetition">Répétition</option>
                <option value="evenement">Évènement</option>
                <option value="autre">Autre</option>
              </Select>
            </Field>
            <Field label="Date" required>
              <Input type="date" value={form.date || ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </Field>
            <Field label="Heure">
              <Input type="time" value={form.start_time || ""} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
            </Field>
            <Field label="Lieu">
              <Input value={form.location || ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </Field>
          </div>
          <Field label="Département concerné">
            <Select value={form.department ?? ""} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value ? Number(e.target.value) : null }))}>
              <option value="">— Tous —</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
