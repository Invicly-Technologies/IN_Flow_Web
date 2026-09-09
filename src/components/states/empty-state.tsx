import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-dark/10 p-10 text-center",
        className
      )}
    >
      <Icon className="h-8 w-8 text-brand-primary" />
      <p className="font-medium text-brand-dark">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-brand-dark/60">{description}</p>
      )}
      {action}
    </div>
  );
}
