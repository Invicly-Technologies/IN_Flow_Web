"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserDTO, AuthTokensDTO } from "@/types/auth";

interface AuthState {
  user: AuthUserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentWorkspaceId: string | null;
  hydrated: boolean;
  setSession: (user: AuthUserDTO, tokens: AuthTokensDTO) => void;
  setAccessToken: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUserDTO) => void;
  setCurrentWorkspaceId: (workspaceId: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      currentWorkspaceId: null,
      hydrated: false,
      setSession: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setAccessToken: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setCurrentWorkspaceId: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null, currentWorkspaceId: null }),
    }),
    {
      name: "flow_auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);

// Mark hydration complete once persisted state has been read from localStorage,
// so the route guard knows not to redirect before it's had a chance to check.
// Guarded to the browser only — this module is also evaluated during Next.js's
// server-side prerendering, where no storage engine (and no `persist` API) exists.
if (typeof window !== "undefined") {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ hydrated: true });
  });
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ hydrated: true });
  }
}
