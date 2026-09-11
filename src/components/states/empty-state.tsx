import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-5 py-14 text-center text-text-secondary",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-flow-soft text-brand-blue">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-[15px] font-semibold text-text">{title}</h4>
      {description && <p className="max-w-[280px] text-[13px]">{description}</p>}
      {action}
    </div>
  );
}
