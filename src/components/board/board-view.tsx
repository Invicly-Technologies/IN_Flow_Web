"use client";

import { useState } from "react";
import { BOARD_COLUMNS } from "@/types/domain";
import { useAppStore } from "@/features/app/store/app-store";
import { useTasks, useUpdateTask } from "@/features/tasks/hooks";
import { TaskMeta } from "@/components/tasks/task-meta";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { TaskListSkeleton } from "@/components/states/skeleton";
import { ErrorState } from "@/components/states/error-state";
import { cn } from "@/lib/utils";

export function BoardView({ projectId }: { projectId: string }) {
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);
  const { data: tasks, isLoading, isError, refetch } = useTasks({ projectId });
  const updateTask = useUpdateTask();

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((col) => (
          <div key={col.id} className="min-w-[270px] max-w-[270px] rounded-lg border border-border bg-bg p-3">
            <TaskListSkeleton rows={2} />
          </div>
        ))}
      </div>
    );
  }
  if (isError) {
    return <ErrorState title="Couldn't load the board" onRetry={() => refetch()} />;
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {BOARD_COLUMNS.map((col) => {
        const colTasks = (tasks ?? []).filter((t) => t.status === col.id);
        return (
          <div key={col.id} className="flex max-h-full min-w-[270px] max-w-[270px] flex-col rounded-lg border border-border bg-bg">
            <div className="flex items-center gap-2 px-3 pb-2 pt-3 text-[13px] font-bold">
              <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
              {col.name}
              <span className="font-medium text-text-faint">{colTasks.length}</span>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.id);
              }}
              onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                if (!dragId) return;
                const dragged = tasks?.find((t) => t.id === dragId);
                if (dragged && dragged.status !== col.id) {
                  updateTask.mutate({ id: dragged.id, version: dragged.version, status: col.id });
                }
                setDragId(null);
              }}
              className={cn(
                "scrollbar-thin flex flex-1 flex-col gap-2 px-2.5 pb-2.5",
                dragOverCol === col.id && "rounded-lg bg-brand-blue/[.06]"
              )}
            >
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => openTaskDetail(t.id)}
                  className={cn(
                    "cursor-grab rounded-[10px] border border-border bg-surface p-3 shadow-xs active:cursor-grabbing",
                    dragId === t.id && "opacity-40"
                  )}
                >
                  <div className="mb-2 text-[13px] font-semibold">{t.title}</div>
                  <TaskMeta task={t} />
                </div>
              ))}
            </div>
            <div className="px-3 pb-3.5 pt-0.5">
              <InlineComposer defaults={{ projectId }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
