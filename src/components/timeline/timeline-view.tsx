"use client";

import { useMemo } from "react";
import { Diamond, Ban, CalendarRange } from "lucide-react";
import { useTasks } from "@/features/tasks/hooks";
import { useAppStore } from "@/features/app/store/app-store";
import { useMilestones } from "@/features/projects/hooks";
import { EmptyState } from "@/components/states/empty-state";
import { priorityColors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DAY_WIDTH = 32;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / (24 * 60 * 60 * 1000));
}

export function TimelineView({ projectId }: { projectId: string }) {
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);
  const { data: tasks } = useTasks({ projectId });
  const { data: milestones } = useMilestones(projectId);

  const { rangeStart, days, rows, todayCol } = useMemo(() => {
    const datedTasks = (tasks ?? []).filter((t) => t.startAt || t.dueAt);
    const dates: Date[] = [];
    datedTasks.forEach((t) => {
      if (t.startAt) dates.push(new Date(t.startAt));
      if (t.dueAt) dates.push(new Date(t.dueAt));
    });
    (milestones ?? []).forEach((m) => m.dueDate && dates.push(new Date(m.dueDate)));

    if (dates.length === 0) {
      return { rangeStart: null as Date | null, days: 0, rows: [], todayCol: -1 };
    }

    const min = startOfDay(new Date(Math.min(...dates.map((d) => d.getTime()))));
    min.setDate(min.getDate() - 2);
    const max = startOfDay(new Date(Math.max(...dates.map((d) => d.getTime()))));
    max.setDate(max.getDate() + 2);
    const totalDays = Math.min(180, Math.max(daysBetween(min, max) + 1, 7));

    const rows = datedTasks.map((t) => {
      const start = t.startAt ? new Date(t.startAt) : new Date(t.dueAt!);
      const end = t.dueAt ? new Date(t.dueAt) : start;
      const startCol = Math.max(0, daysBetween(min, start));
      const endCol = Math.max(startCol, daysBetween(min, end));
      return { task: t, startCol, span: endCol - startCol + 1 };
    });

    return { rangeStart: min, days: totalDays, rows, todayCol: daysBetween(min, new Date()) };
  }, [tasks, milestones]);

  const undated = (tasks ?? []).filter((t) => !t.startAt && !t.dueAt).length;

  if (!rangeStart) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Nothing to plot yet"
        description="Give tasks a start or due date to see them on the timeline."
      />
    );
  }

  const dayLabels = Array.from({ length: days }, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <div style={{ minWidth: days * DAY_WIDTH + 200 }}>
        <div className="sticky top-0 z-10 flex border-b border-border bg-surface">
          <div className="w-[200px] shrink-0" />
          <div className="relative flex">
            {dayLabels.map((d, i) => (
              <div
                key={i}
                style={{ width: DAY_WIDTH }}
                className={cn(
                  "shrink-0 border-l border-border/60 py-1.5 text-center text-[10px] font-semibold text-text-faint",
                  i === todayCol && "bg-brand-flow-soft text-brand-blue"
                )}
              >
                {d.getDate() === 1 || i === 0 ? d.toLocaleDateString("en-US", { month: "short" }) + " " : ""}
                {d.getDate()}
              </div>
            ))}
            {(milestones ?? []).map((m) => {
              if (!m.dueDate) return null;
              const col = daysBetween(rangeStart, new Date(m.dueDate));
              if (col < 0 || col >= days) return null;
              return (
                <div
                  key={m.id}
                  title={m.name}
                  className="absolute top-0.5 flex justify-center"
                  style={{ left: col * DAY_WIDTH, width: DAY_WIDTH }}
                >
                  <Diamond className="h-3 w-3 fill-brand-blue text-brand-blue" />
                </div>
              );
            })}
          </div>
        </div>

        {rows.map(({ task, startCol, span }) => (
          <div key={task.id} className="flex items-center border-b border-border/60 hover:bg-bg">
            <div
              onClick={() => openTaskDetail(task.id)}
              className={cn(
                "w-[200px] shrink-0 cursor-pointer truncate px-2.5 py-2 text-[12.5px] font-medium",
                task.status === "COMPLETED" && "text-text-faint line-through"
              )}
              title={task.title}
            >
              {task.title}
            </div>
            <div className="relative flex-1" style={{ height: 34 }}>
              <div
                onClick={() => openTaskDetail(task.id)}
                className="absolute top-1.5 flex h-5 cursor-pointer items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold text-white"
                style={{
                  left: startCol * DAY_WIDTH,
                  width: Math.max(span * DAY_WIDTH - 4, DAY_WIDTH - 4),
                  background: task.status === "COMPLETED" ? "rgb(var(--text-faint))" : priorityColors[task.priority],
                }}
              >
                {task.isBlocked && <Ban className="h-2.5 w-2.5 shrink-0" />}
                <span className="truncate">{task.priority !== "P4" ? task.priority : ""}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {undated > 0 && (
        <p className="mt-3 px-2.5 text-[12px] text-text-faint">
          {undated} task{undated === 1 ? "" : "s"} without a start or due date aren&apos;t shown here.
        </p>
      )}
    </div>
  );
}
