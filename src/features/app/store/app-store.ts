"use client";

import { create } from "zustand";
import type { ProjectTab } from "@/types/domain";

export interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Pure UI/ephemeral state — not app data. Tasks/projects/labels are server
 * state and live in TanStack Query (see features/{tasks,projects,labels}/hooks.ts),
 * not here.
 */
export type Theme = "light" | "dark" | "system";

interface AppState {
  theme: Theme;

  activeProjectId: string | null;
  projectTab: ProjectTab;
  activeFilterId: string;
  calMonth: Date;
  detailTaskId: string | null;
  searchOpen: boolean;
  toasts: Toast[];

  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  hydrateTheme: () => void;

  setActiveProject: (id: string | null) => void;
  setProjectTab: (tab: ProjectTab) => void;
  setActiveFilter: (id: string) => void;
  setCalMonth: (d: Date) => void;

  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
  openSearch: () => void;
  closeSearch: () => void;

  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function resolvesToDark(theme: Theme): boolean {
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark";
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", resolvesToDark(theme));
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: "light",

  activeProjectId: null,
  projectTab: "list",
  activeFilterId: "all",
  calMonth: new Date(),
  detailTaskId: null,
  searchOpen: false,
  toasts: [],

  toggleTheme: () => {
    const next = resolvesToDark(get().theme) ? "light" : "dark";
    get().setTheme(next);
  },
  setTheme: (theme) => {
    set({ theme });
    window.localStorage.setItem("flow_theme", theme);
    applyTheme(theme);
  },
  hydrateTheme: () => {
    const stored = window.localStorage.getItem("flow_theme");
    const theme: Theme = stored === "dark" || stored === "system" ? stored : "light";
    set({ theme });
    applyTheme(theme);
  },

  setActiveProject: (id) => set({ activeProjectId: id, projectTab: "list" }),
  setProjectTab: (tab) => set({ projectTab: tab }),
  setActiveFilter: (id) => set({ activeFilterId: id }),
  setCalMonth: (d) => set({ calMonth: d }),

  openTaskDetail: (id) => set({ detailTaskId: id }),
  closeTaskDetail: () => set({ detailTaskId: null }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  pushToast: (t) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
