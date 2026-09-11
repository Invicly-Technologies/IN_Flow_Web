"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-[110] bg-navy/40" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[111] w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-lg outline-none",
          className
        )}
      >
        <div className="mb-4 flex items-start gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-flow text-white">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <RadixDialog.Title className="text-base font-bold text-text">{title}</RadixDialog.Title>
            {description && <RadixDialog.Description className="mt-0.5 text-[13px] text-text-secondary">{description}</RadixDialog.Description>}
          </div>
          <RadixDialog.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg">
            <X className="h-4 w-4" />
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
