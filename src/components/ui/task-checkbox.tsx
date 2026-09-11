import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@prisma/client";
import { priorityColors } from "@/lib/design-tokens";

const PRIORITY_BORDER: Record<TaskPriority, string | undefined> = {
  P1: priorityColors.P1,
  P2: priorityColors.P2,
  P3: priorityColors.P3,
  P4: undefined,
};

export function TaskCheckbox({
  done,
  priority,
  size = 19,
  onClick,
}: {
  done: boolean;
  priority: TaskPriority;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const borderColor = PRIORITY_BORDER[priority];
  return (
    <div
      role="checkbox"
      aria-checked={done}
      onClick={onClick}
      className={cn(
        "mt-[1px] flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
        done ? "bg-brand-flow border-transparent" : "bg-surface hover:bg-brand-flow-soft"
      )}
      style={{
        width: size,
        height: size,
        borderColor: done ? "transparent" : borderColor ?? "rgb(var(--border))",
      }}
    >
      <Check
        className={cn("transition-all", done ? "scale-100 opacity-100" : "scale-50 opacity-0")}
        style={{ width: size * 0.58, height: size * 0.58 }}
        color="#fff"
        strokeWidth={3}
      />
    </div>
  );
}
