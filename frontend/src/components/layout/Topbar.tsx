"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Avatar, Badge } from "@/components/ui/feedback";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch {
      /* ignore */
    }
    logout();
    router.replace("/login");
  };

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">
            Bonjour, {user?.first_name || "bienvenue"} 👋
          </p>
          <p className="text-xs capitalize text-muted-foreground">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-muted"
          >
            <Avatar name={user?.full_name || "?"} src={user?.photo} size={36} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.roles?.[0] || "Utilisateur"}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="glass-strong absolute right-0 mt-2 w-64 rounded-xl p-2 shadow-2xl"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user?.roles?.map((r) => (
                      <Badge key={r} tone="violet">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-300"
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
