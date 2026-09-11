"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

export interface SearchResults {
  tasks: { id: string; title: string; status: string; projectId: string | null }[];
  projects: { id: string; name: string; color: string | null; icon: string | null }[];
  labels: { id: string; name: string; color: string | null }[];
  people: { id: string; fullName: string; email: string; avatarUrl: string | null }[];
  comments: { id: string; body: string; taskId: string }[];
  files: { id: string; fileName: string; taskId: string | null }[];
}

export function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => apiRequest<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.length > 0,
  });
}
