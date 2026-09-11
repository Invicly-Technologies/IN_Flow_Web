"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/features/app/store/app-store";
import { useCalendar } from "@/features/calendar/hooks";
import { useUpdateTask } from "@/features/tasks/hooks";
import { useProjects } from "@/features/projects/hooks";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { todayISO, toISODateTime } from "@/features/app/utils/date";
import { priorityColors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/task";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Cell {
  day: number;
  out: boolean;
  iso?: string;
}

export function CalendarView({ projectId }: { projectId?: string }) {
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);
  const calMonth = useAppStore((s) => s.calMonth);
  const setCalMonth = useAppStore((s) => s.setCalMonth);
  const updateTask = useUpdateTask();

  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverIso, setDragOverIso] = useState<string | null>(null);
  const [addTaskDate, setAddTaskDate] = useState<string | null>(null);
  const { data: projects } = useProjects();

  function chipColor(task: TaskDTO): string | undefined {
    const project = projects?.find((p) => p.id === task.projectId);
    if (project?.color) return project.color;
    if (task.priority !== "P4") return priorityColors[task.priority];
    return undefined;
  }

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: Cell[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: daysInPrevMonth - startOffset + i + 1, out: true });
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, out: false, iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}` });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) cells.push({ day: nextDay++, out: true });

  const rangeStart = useMemo(() => new Date(Date.UTC(year, month, 1)), [year, month]);
  const rangeEnd = useMemo(() => new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)), [year, month]);
  const { data, isLoading } = useCalendar(rangeStart, rangeEnd, projectId);
  const tasks = data?.tasks ?? [];

  const monthName = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = todayISO();

  function moveTaskTo(taskId: string, iso: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({ id: task.id, version: task.version, dueAt: toISODateTime(iso) });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 pb-3 pt-0">
        <h2 className="m-0 text-[17px] font-bold">{monthName}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setCalMonth(new Date(year, month - 1, 1))}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-border bg-surface text-text-secondary hover:bg-bg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCalMonth(new Date())}
            className="flex h-[34px] items-center justify-center rounded-[9px] border border-border bg-surface px-2.5 text-xs font-bold text-text-secondary hover:bg-bg"
          >
            Today
          </button>
          <button
            onClick={() => setCalMonth(new Date(year, month + 1, 1))}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-border bg-surface text-text-secondary hover:bg-bg"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {isLoading && <span className="ml-2 text-xs text-text-faint">Loading…</span>}
        <span className="ml-auto text-xs text-text-faint">Drag a task to reschedule · click a day to add one</span>
      </div>

      <div className="mb-5 grid flex-1 grid-cols-7 auto-rows-fr overflow-hidden rounded-md border-l border-t border-border bg-surface">
        {DOW.map((d) => (
          <div key={d} className="border-b border-r border-border bg-bg p-2 text-center text-[11px] font-bold text-text-secondary">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const isToday = c.iso === today;
          const dayTasks = c.iso ? tasks.filter((t) => t.dueAt?.slice(0, 10) === c.iso) : [];
          const isDragOver = c.iso && dragOverIso === c.iso;
          return (
            <div
              key={i}
              onClick={() => c.iso && !c.out && setAddTaskDate(c.iso)}
              onDragOver={(e) => {
                if (!c.iso) return;
                e.preventDefault();
                setDragOverIso(c.iso);
              }}
              onDragLeave={() => setDragOverIso((prev) => (prev === c.iso ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIso(null);
                if (dragTaskId && c.iso) moveTaskTo(dragTaskId, c.iso);
                setDragTaskId(null);
              }}
              className={cn(
                "min-h-[64px] cursor-pointer border-b border-r border-border p-1.5 transition-colors md:min-h-[90px]",
                c.out && "bg-bg opacity-50",
                isDragOver && "bg-brand-blue/[.08]"
              )}
            >
              <div
                className={cn(
                  "text-xs font-semibold text-text-secondary",
                  isToday && "flex h-5 w-5 items-center justify-center rounded-full bg-brand-flow text-white"
                )}
              >
                {c.day}
              </div>
              {dayTasks.slice(0, 3).map((t) => {
                const color = chipColor(t);
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDragTaskId(t.id);
                    }}
                    onDragEnd={() => setDragTaskId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskDetail(t.id);
                    }}
                    style={color ? { background: `${color}22`, color } : undefined}
                    className={cn(
                      "mt-1 cursor-grab overflow-hidden text-ellipsis whitespace-nowrap rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-semibold active:cursor-grabbing",
                      !color && "bg-brand-flow-soft text-brand-blue",
                      t.status === "COMPLETED" && "opacity-60 line-through",
                      dragTaskId === t.id && "opacity-40"
                    )}
                  >
                    {t.title}
                  </div>
                );
              })}
              {dayTasks.length > 3 && (
                <div className="mt-1 text-[10.5px] font-semibold text-text-faint">+{dayTasks.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>

      <TaskFormDialog
        open={!!addTaskDate}
        onOpenChange={(open) => !open && setAddTaskDate(null)}
        defaultProjectId={projectId ?? null}
        defaultDueDate={addTaskDate}
      />
    </div>
  );
}
