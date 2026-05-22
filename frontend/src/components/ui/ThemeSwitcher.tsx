"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { v: "light", icon: Sun, label: "Clair" },
  { v: "system", icon: Monitor, label: "Système" },
  { v: "dark", icon: Moon, label: "Sombre" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-[104px] rounded-lg bg-muted" />;

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {OPTIONS.map((o) => {
        const active = theme === o.v;
        return (
          <button
            key={o.v}
            onClick={() => setTheme(o.v)}
            title={o.label}
            aria-label={o.label}
            className={cn(
              "flex h-7 w-8 items-center justify-center rounded-md transition",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <o.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
