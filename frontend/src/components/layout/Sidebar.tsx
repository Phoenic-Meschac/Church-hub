"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Church, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV, isParent, type NavLink as NavLinkType } from "@/lib/nav";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  collapsed,
  onToggle,
  churchName = "ChurchHub",
  onNavigate,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  churchName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hasPerm = useAuthStore((s) => s.hasPerm);
  const isActive = useActive();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Auto-open the parent containing the active route
  useEffect(() => {
    const next: Record<string, boolean> = {};
    NAV.forEach((g) =>
      g.items.forEach((it) => {
        if (isParent(it) && it.children.some((c) => isActive(c.href))) next[it.label] = true;
      })
    );
    setOpen((prev) => ({ ...next, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderLink = (item: NavLinkType, child = false) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 text-sm transition-colors",
          child ? "ml-3 py-2" : "py-2.5",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {active && (
          <>
            <motion.span
              layoutId="nav-active"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/25 to-fuchsia-500/10 ring-1 ring-border"
            />
            <motion.span
              layoutId="nav-bar"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-fuchsia-400"
            />
          </>
        )}
        <item.icon
          className={cn(
            "relative shrink-0 transition-colors",
            child ? "h-4 w-4" : "h-5 w-5",
            active
              ? "text-brand-600 dark:text-brand-300"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="relative truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 272 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong relative flex h-full flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-900/40">
          <Church className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="truncate font-semibold text-foreground">{churchName}</p>
              <p className="text-[11px] text-muted-foreground">Gestion d&apos;église</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAV.map((group) => {
          const items = group.items.filter((it) =>
            isParent(it)
              ? it.children.some((c) => !c.perm || hasPerm(c.perm))
              : !it.perm || hasPerm(it.perm)
          );
          if (items.length === 0) return null;
          return (
            <div key={group.group}>
              {!collapsed ? (
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.group}
                </p>
              ) : (
                <div className="mx-3 mb-1.5 border-t border-border" />
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  if (!isParent(item)) return renderLink(item);

                  const children = item.children.filter((c) => !c.perm || hasPerm(c.perm));
                  const childActive = children.some((c) => isActive(c.href));
                  const isOpen = open[item.label] ?? false;

                  // Collapsed: link straight to the first child (icon only)
                  if (collapsed) {
                    return (
                      <Link
                        key={item.label}
                        href={children[0].href}
                        onClick={onNavigate}
                        title={item.label}
                        className={cn(
                          "group relative flex items-center justify-center rounded-xl px-3 py-2.5 transition-colors",
                          childActive ? "text-brand-600 dark:text-brand-300" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setOpen((o) => ({ ...o, [item.label]: !isOpen }))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          childActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            childActive ? "text-brand-600 dark:text-brand-300" : ""
                          )}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1 space-y-1 border-l border-border pl-2">
                              {children.map((c) => renderLink(c, true))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      {onToggle && (
        <div className="border-t border-border p-3">
          <button
            onClick={onToggle}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>Réduire</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.aside>
  );
}
