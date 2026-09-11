"use client";

import { useEffect } from "react";
import { useAppStore } from "@/features/app/store/app-store";

/** Applies the persisted theme class on mount, avoiding SSR/CSR mismatch. */
export function ThemeInitializer() {
  const hydrateTheme = useAppStore((s) => s.hydrateTheme);
  useEffect(() => {
    hydrateTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (useAppStore.getState().theme === "system") {
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [hydrateTheme]);
  return null;
}
