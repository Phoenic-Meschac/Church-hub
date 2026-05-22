"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getList } from "./api";
import { toast } from "@/components/ui/toast";

export function apiError(e: unknown): string {
  const err = e as { response?: { data?: unknown } };
  const d = err?.response?.data;
  if (typeof d === "string") return d;
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (obj.detail) return String(obj.detail);
    const firstKey = Object.keys(obj)[0];
    if (firstKey) {
      const v = obj[firstKey];
      return `${firstKey}: ${Array.isArray(v) ? v[0] : v}`;
    }
  }
  return "Une erreur est survenue.";
}

export function useEntities<T>(key: unknown[], url: string, params?: Record<string, unknown>) {
  return useQuery({ queryKey: key, queryFn: () => getList<T>(url, params) });
}

interface MutationLabels {
  created?: string;
  updated?: string;
  deleted?: string;
}

export function useEntityMutations(url: string, keys: unknown[][], labels?: MutationLabels) {
  const qc = useQueryClient();
  const invalidate = () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post(url, payload).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      toast.success(labels?.created ?? "Enregistré avec succès.");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Record<string, unknown>) =>
      api.patch(`${url}${id}/`, payload).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      toast.success(labels?.updated ?? "Modifié avec succès.");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    onSuccess: () => {
      invalidate();
      toast.success(labels?.deleted ?? "Supprimé.");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return { create, update, remove, invalidate };
}
