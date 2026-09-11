"use client";

import { Calendar, Flag, CheckSquare, Bell } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import { useProjects } from "@/features/projects/hooks";
import { AssigneeAvatar } from "@/components/tasks/assignee-picker";
import { dateOnly, fmtDate, isOverdue, todayISO } from "@/features/app/utils/date";
import { priorityColors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TaskMeta({ task }: { task: TaskDTO }) {
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === task.projectId);
  const due = dateOnly(task.dueAt);
  const overdue = isOverdue(due) && task.status !== "COMPLETED";
  const isToday = due === todayISO();

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {project?.key && task.number != null && (
        <span className="font-mono text-[11px] font-bold text-text-faint">
          {project.key}-{task.number}
        </span>
      )}
      {due && (
        <span
          className={cn(
            "flex items-center gap-1 text-[11.5px] font-medium text-text-secondary",
            (overdue || isToday) && "rounded-full px-[7px] py-[2px] text-[10.5px] font-bold",
            overdue && "bg-state-danger/10 text-[#C23434]",
            !overdue && isToday && "bg-state-warning/10 text-[#B4740E]"
          )}
        >
          <Calendar className="h-3 w-3" />
          {fmtDate(due)}
        </span>
      )}
      {task.priority !== "P4" && (
        <span
          className="flex items-center gap-1 text-[11.5px] font-medium"
          style={{ color: priorityColors[task.priority] }}
        >
          <Flag className="h-3 w-3" />
          {task.priority}
        </span>
      )}
      {project && (
        <span className="flex items-center gap-[5px] text-[11.5px] font-medium text-text-secondary">
          <span className="h-[7px] w-[7px] shrink-0 rounded-[2px]" style={{ background: project.color ?? "#94A3B8" }} />
          {project.name}
        </span>
      )}
      {task.labels.map((label) => {
        const color = label.color ?? "#315CFF";
        return (
          <span
            key={label.id}
            className="rounded-full px-2 py-[2px] text-[10.5px] font-semibold"
            style={{ background: hexToRgba(color, 0.14), color }}
          >
            {label.name}
          </span>
        );
      })}
      {task.checklist.length > 0 && (
        <span className="flex items-center gap-1 text-[11.5px] font-medium text-text-secondary">
          <CheckSquare className="h-3 w-3" />
          {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
        </span>
      )}
      {task.hasActiveReminder && (
        <span className="flex items-center gap-1 text-[11.5px] font-medium text-brand-blue">
          <Bell className="h-3 w-3" />
        </span>
      )}
      {task.assigneeId && <AssigneeAvatar userId={task.assigneeId} size={18} />}
    </div>
  );
}
