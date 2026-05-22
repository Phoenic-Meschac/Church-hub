"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AuthGuard } from "./AuthGuard";
import { Toaster } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { ChurchProfile } from "@/lib/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const { data: profile } = useQuery<ChurchProfile>({
    queryKey: ["church-profile"],
    queryFn: async () => (await api.get("/church-profile/")).data,
  });
  const churchName = profile?.name ?? "ChurchHub";

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            churchName={churchName}
          />
        </div>

        {/* Sidebar mobile (drawer) */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: -290 }}
                animate={{ x: 0 }}
                exit={{ x: -290 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
              >
                <Sidebar
                  collapsed={false}
                  churchName={churchName}
                  onNavigate={() => setMobileOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-7xl"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <Toaster />
      </div>
    </AuthGuard>
  );
}
