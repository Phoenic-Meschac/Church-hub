import {
  LayoutDashboard,
  Users,
  Network,
  CalendarCheck,
  ListTodo,
  Wallet,
  Landmark,
  HandCoins,
  Gift,
  Receipt,
  ShieldCheck,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  perm?: string;
}

export interface NavParent {
  label: string;
  icon: LucideIcon;
  perm?: string;
  children: NavLink[];
}

export type NavEntry = NavLink | NavParent;

export interface NavGroup {
  group: string;
  items: NavEntry[];
}

export function isParent(entry: NavEntry): entry is NavParent {
  return (entry as NavParent).children !== undefined;
}

export const NAV: NavGroup[] = [
  {
    group: "Pilotage",
    items: [{ label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, perm: "dashboard.view" }],
  },
  {
    group: "Communauté",
    items: [
      { label: "Ouvriers", href: "/ouvriers", icon: Users, perm: "workers.view" },
      { label: "Départements", href: "/departements", icon: Network, perm: "departments.view" },
      { label: "Présences", href: "/presences", icon: CalendarCheck, perm: "workers.view" },
      { label: "Tâches", href: "/taches", icon: ListTodo, perm: "workers.view" },
    ],
  },
  {
    group: "Gestion",
    items: [
      {
        label: "Finances",
        icon: Wallet,
        perm: "treasury.view",
        children: [
          { label: "Vue d'ensemble", href: "/tresorerie", icon: Wallet, perm: "treasury.view" },
          { label: "Caisses", href: "/caisses", icon: Landmark, perm: "treasury.view" },
          { label: "Dîmes", href: "/dimes", icon: HandCoins, perm: "treasury.view" },
          { label: "Offrandes", href: "/offrandes", icon: Gift, perm: "treasury.view" },
          { label: "Dépenses", href: "/depenses", icon: Receipt, perm: "treasury.view" },
        ],
      },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Utilisateurs & rôles", href: "/iam", icon: ShieldCheck, perm: "iam.view" },
      { label: "Audit", href: "/audit", icon: ScrollText, perm: "audit.view" },
    ],
  },
];
