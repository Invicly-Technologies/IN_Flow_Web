"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import type { Label } from "@prisma/client";
import type { CreateLabelInput, UpdateLabelInput } from "@/features/labels/validations/label.validations";

export function useLabels() {
  return useQuery({
    queryKey: ["labels"],
    queryFn: () => apiRequest<Label[]>("/labels"),
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLabelInput) => apiRequest<Label>("/labels", { method: "POST", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateLabelInput & { id: string }) =>
      apiRequest<Label>(`/labels/${id}`, { method: "PATCH", body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<{ deleted: boolean }>(`/labels/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}
