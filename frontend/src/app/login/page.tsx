"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Church, Lock, Mail, ShieldCheck, Users, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/form";

const FEATURES = [
  { icon: Users, text: "Ouvriers, départements & présences" },
  { icon: Wallet, text: "Trésorerie : dîmes, offrandes, caisses" },
  { icon: ShieldCheck, text: "Rôles, permissions & journal d'audit" },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const access = useAuthStore((s) => s.access);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [email, setEmail] = useState("admin@churchhub.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && access) router.replace("/dashboard");
  }, [hydrated, access, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login/", { email, password });
      setAuth(res.data.access, res.data.refresh, res.data.user);
      router.replace("/dashboard");
    } catch {
      setError("Identifiants invalides. Vérifiez votre email et mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 lg:flex">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl"
        />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-xl shadow-indigo-900/40">
              <Church className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">ChurchHub</span>
          </div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-md text-4xl font-bold leading-tight text-white"
            >
              La gestion de votre église,{" "}
              <span className="text-gradient">élevée au niveau supérieur</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 max-w-md text-slate-400"
            >
              Une plateforme complète pour piloter vos ouvriers, vos finances et votre
              administration en toute sérénité.
            </motion.p>

            <div className="mt-8 space-y-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <f.icon className="h-4 w-4 text-brand-300" />
                  </div>
                  <span className="text-sm">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-600">© {new Date().getFullYear()} ChurchHub</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card w-full max-w-md p-8"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
              <Church className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">ChurchHub</span>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">Bienvenue 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">Connectez-vous pour accéder à votre espace.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="Adresse email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@eglise.org"
                  className="pl-10"
                  required
                />
              </div>
            </Field>

            <Field label="Mot de passe">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </Field>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Se connecter
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Comptes de démonstration</p>
            <p className="mt-1">
              Admin : <span className="text-foreground">admin@churchhub.local</span> / admin123
            </p>
            <p>
              Trésorier : <span className="text-foreground">tresorier@churchhub.local</span> / demo123
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
