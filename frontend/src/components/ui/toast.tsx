"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastStore {
  items: ToastItem[];
  push: (message: string, type: ToastType) => void;
  remove: (id: number) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (message, type) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, message, type }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3800);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().push(m, "success"),
  error: (m: string) => useToastStore.getState().push(m, "error"),
  info: (m: string) => useToastStore.getState().push(m, "info"),
};

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <AlertTriangle className="h-5 w-5 text-rose-400" />,
  info: <Info className="h-5 w-5 text-sky-400" />,
};

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const remove = useToastStore((s) => s.remove);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl"
          >
            {ICONS[t.type]}
            <p className="flex-1 text-sm text-foreground">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
