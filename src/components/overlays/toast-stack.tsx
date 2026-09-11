"use client";

import { useAppStore } from "@/features/app/store/app-store";

export function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 rounded-[10px] bg-navy px-4 py-2.5 text-[13px] font-medium text-white shadow-lg"
        >
          <span>{t.message}</span>
          {t.actionLabel && (
            <a
              className="cursor-pointer font-bold text-[#7FB1FF]"
              onClick={() => {
                t.onAction?.();
                dismissToast(t.id);
              }}
            >
              {t.actionLabel}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
