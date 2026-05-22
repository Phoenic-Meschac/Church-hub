"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Church } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

function Splash() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-xl shadow-indigo-900/40"
      >
        <Church className="h-8 w-8 text-white" />
      </motion.div>
      <p className="text-sm text-muted-foreground">Chargement de ChurchHub…</p>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const access = useAuthStore((s) => s.access);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!hydrated) return;
    if (!access) {
      router.replace("/login");
      return;
    }
    api
      .get("/auth/me/")
      .then((r) => setUser(r.data))
      .catch(() => {
        /* interceptor handles refresh/logout */
      });
  }, [hydrated, access, router, setUser]);

  if (!hydrated || !access) return <Splash />;
  return <>{children}</>;
}
