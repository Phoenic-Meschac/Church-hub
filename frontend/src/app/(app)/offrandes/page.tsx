"use client";

import { useState } from "react";
import { Gift, Tags, Plus, X } from "lucide-react";
import { TransactionManager } from "@/components/treasury/TransactionManager";
import type { OfferingType } from "@/lib/types";
import { useEntities, useEntityMutations } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/form";

export default function OffrandesPage() {
  const canManage = useAuthStore((s) => s.hasPerm("treasury.manage"));
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { data: types } = useEntities<OfferingType>(["offering-types"], "/offering-types/");
  const mut = useEntityMutations("/offering-types/", [["offering-types"]], {
    created: "Type ajouté.",
    deleted: "Type supprimé.",
  });

  const add = async () => {
    if (!name.trim() || !code.trim()) return;
    await mut.create.mutateAsync({ name: name.trim(), code: code.trim().toUpperCase() });
    setName("");
    setCode("");
  };

  return (
    <>
      <TransactionManager
        title="Offrandes"
        subtitle="Offrandes par type et suivi des collectes"
        icon={Gift}
        category="offering"
        extraActions={
          canManage && (
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Tags className="h-4 w-4" /> Types d&apos;offrande
            </Button>
          )
        }
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Types d'offrande">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Nom (ex : Action de grâce)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-28" />
            <Button onClick={add} loading={mut.create.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {types?.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <div>
                  <p className="text-sm text-white">{t.name}</p>
                  <p className="font-mono text-xs text-slate-500">{t.code}</p>
                </div>
                <button
                  onClick={() => mut.remove.mutate(t.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(!types || types.length === 0) && (
              <p className="py-4 text-center text-sm text-slate-500">Aucun type défini.</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
