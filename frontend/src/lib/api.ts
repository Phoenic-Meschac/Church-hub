import axios from "axios";
import { useAuthStore } from "./auth-store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = useAuthStore.getState().refresh;
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    const newAccess = res.data.access as string;
    useAuthStore.getState().setAccess(newAccess);
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken();
      const newAccess = await refreshPromise;
      refreshPromise = null;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Helpers ----------------------------------------------------------------
export async function getList<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const res = await api.get(url, { params });
  return res.data.results ?? res.data;
}

export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_MEDIA_URL || "http://127.0.0.1:8000";
  return `${base}${path}`;
}
