import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-state-danger/20 bg-state-danger/5 p-10 text-center",
        className
      )}
    >
      <AlertTriangle className="h-8 w-8 text-state-danger" />
      <p className="font-medium text-text">{title}</p>
      <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl bg-state-danger px-4 py-2 text-sm font-medium text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}
