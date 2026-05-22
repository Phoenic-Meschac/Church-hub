import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserMe } from "./types";

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: UserMe | null;
  hydrated: boolean;
  setAuth: (access: string, refresh: string, user: UserMe) => void;
  setUser: (user: UserMe) => void;
  setAccess: (access: string) => void;
  logout: () => void;
  hasPerm: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      access: null,
      refresh: null,
      user: null,
      hydrated: false,
      setAuth: (access, refresh, user) => set({ access, refresh, user }),
      setUser: (user) => set({ user }),
      setAccess: (access) => set({ access }),
      logout: () => set({ access: null, refresh: null, user: null }),
      hasPerm: (code) => {
        const u = get().user;
        if (!u) return false;
        if (u.is_superuser) return true;
        return u.permissions.includes(code);
      },
    }),
    {
      name: "churchhub-auth",
      partialize: (state) => ({
        access: state.access,
        refresh: state.refresh,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
