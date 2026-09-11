"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Layers, ListChecks, Trash2, FolderInput, Flag, X, MoreHorizontal, ExternalLink, type LucideIcon } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import { useAppStore } from "@/features/app/store/app-store";
import { useCompleteTask, useReopenTask, useDeleteTask, useBulkTaskAction } from "@/features/tasks/hooks";
import { useProjects } from "@/features/projects/hooks";
import { TaskCheckbox } from "@/components/ui/task-checkbox";
import { TaskMeta } from "@/components/tasks/task-meta";
import { AssigneeAvatar } from "@/components/tasks/assignee-picker";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { TaskListSkeleton } from "@/components/states/skeleton";
import { priorityColors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@prisma/client";

export function TaskRow({
  task,
  selectable,
  selected,
  onToggleSelect,
}: {
  task: TaskDTO;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);
  const complete = useCompleteTask();
  const reopen = useReopenTask();
  const deleteTask = useDeleteTask();
  const pushToast = useAppStore((s) => s.pushToast);
  const done = task.status === "COMPLETED";
  const hasRail = !done && task.priority !== "P4";

  return (
    <div
      className="group relative flex cursor-pointer items-start gap-[11px] rounded-[10px] py-[9px] pl-[14px] pr-[9px] transition-colors hover:bg-bg"
      onClick={() => (selectable ? onToggleSelect?.() : openTaskDetail(task.id))}
    >
      {/* Priority rail — thin rounded bar on the leading edge, empty for P4/none */}
      <span
        aria-hidden
        className={cn("absolute bottom-1 left-[3px] top-1 w-[3px] rounded-full", !hasRail && "bg-transparent")}
        style={hasRail ? { background: priorityColors[task.priority] } : undefined}
      />
      {selectable && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect?.()}
          onClick={(e) => e.stopPropagation()}
          className="mt-[3px] h-4 w-4 shrink-0 accent-brand-blue"
        />
      )}
      <TaskCheckbox
        done={done}
        priority={task.priority}
        onClick={(e) => {
          e.stopPropagation();
          if (done) reopen.mutate(task.id);
          else
            complete.mutate(task.id, {
              onError: (err) => pushToast({ message: err instanceof Error ? err.message : "Couldn't complete task" }),
            });
        }}
      />
      <div className="min-w-0 flex-1">
        <div className={cn("text-[13.8px] font-medium text-text", done && "text-text-faint line-through")}>
          {task.title}
        </div>
        <TaskMeta task={task} />
      </div>

      {/* Hover-revealed trailing actions */}
      <div
        className="ml-1 hidden shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:flex"
        onClick={(e) => e.stopPropagation()}
      >
        {task.assigneeId && <AssigneeAvatar userId={task.assigneeId} size={20} />}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              aria-label="More actions"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-faint hover:bg-border/60 hover:text-text"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-[120] min-w-[160px] rounded-[10px] border border-border bg-surface p-1.5 shadow-lg"
            >
              <DropdownMenu.Item
                onClick={() => openTaskDetail(task.id)}
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-text outline-none hover:bg-bg"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open task
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() =>
                  done
                    ? reopen.mutate(task.id)
                    : complete.mutate(task.id, {
                        onError: (err) => pushToast({ message: err instanceof Error ? err.message : "Couldn't complete task" }),
                      })
                }
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-text outline-none hover:bg-bg"
              >
                <ListChecks className="h-3.5 w-3.5" />
                {done ? "Reopen" : "Complete"}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() =>
                  deleteTask.mutate(task.id, {
                    onError: () => pushToast({ message: "Couldn't delete task" }),
                  })
                }
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-state-danger outline-none hover:bg-bg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

interface TaskListProps {
  tasks: TaskDTO[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyText?: string;
  emptyIcon?: LucideIcon;
  /** Renders a "Select" toggle above the list and a floating bulk-action bar. Off by default — used on views where multi-select is worth the extra chrome (Today/Inbox/Upcoming/project lists). */
  allowBulkActions?: boolean;
}

export function TaskList({
  tasks,
  isLoading,
  isError,
  onRetry,
  emptyTitle,
  emptyText,
  emptyIcon,
  allowBulkActions,
}: TaskListProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (isLoading) return <TaskListSkeleton />;
  if (isError) {
    return <ErrorState title="Couldn't load tasks" message="Check your connection and try again." onRetry={onRetry} />;
  }
  if (!tasks || (tasks.length === 0 && emptyTitle)) {
    const Icon = emptyIcon ?? Layers;
    return <EmptyState icon={Icon} title={emptyTitle ?? "Nothing here"} description={emptyText} />;
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  return (
    <div className="relative flex flex-col">
      {allowBulkActions && !!tasks?.length && (
        <div className="flex justify-end pb-1">
          <button
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold text-text-secondary hover:text-brand-blue"
          >
            <ListChecks className="h-3.5 w-3.5" />
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
      )}
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} selectable={selectMode} selected={selected.has(t.id)} onToggleSelect={() => toggle(t.id)} />
      ))}
      {selectMode && selected.size > 0 && (
        <BulkActionBar count={selected.size} ids={[...selected]} onDone={exitSelectMode} />
      )}
    </div>
  );
}

function BulkActionBar({ count, ids, onDone }: { count: number; ids: string[]; onDone: () => void }) {
  const bulkAction = useBulkTaskAction();
  const pushToast = useAppStore((s) => s.pushToast);
  const { data: projects = [] } = useProjects();
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);

  function run(input: Parameters<typeof bulkAction.mutate>[0]) {
    bulkAction.mutate(input, {
      onSuccess: (res) => {
        pushToast({ message: `Updated ${res.updated} task${res.updated === 1 ? "" : "s"}` });
        onDone();
      },
      onError: () => pushToast({ message: "Bulk action failed" }),
    });
  }

  return (
    <div className="fixed bottom-[76px] left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 shadow-lg md:bottom-6">
      <span className="mr-1 whitespace-nowrap text-[12.5px] font-bold text-text">{count} selected</span>
      <button
        onClick={() => run({ ids, action: "complete" })}
        className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue"
      >
        Complete
      </button>

      <div className="relative">
        <button
          onClick={() => setMovePickerOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue"
        >
          <FolderInput className="h-3 w-3" />
          Move
        </button>
        {movePickerOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 max-h-52 w-44 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg">
            <div
              onClick={() => {
                run({ ids, action: "move", projectId: null });
                setMovePickerOpen(false);
              }}
              className="cursor-pointer rounded-md px-2 py-1.5 text-[12.5px] font-medium hover:bg-bg"
            >
              Inbox
            </div>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  run({ ids, action: "move", projectId: p.id });
                  setMovePickerOpen(false);
                }}
                className="cursor-pointer truncate rounded-md px-2 py-1.5 text-[12.5px] font-medium hover:bg-bg"
              >
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setPriorityPickerOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue"
        >
          <Flag className="h-3 w-3" />
          Priority
        </button>
        {priorityPickerOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 w-32 rounded-lg border border-border bg-surface p-1 shadow-lg">
            {(["P1", "P2", "P3", "P4"] as TaskPriority[]).map((p) => (
              <div
                key={p}
                onClick={() => {
                  run({ ids, action: "setPriority", priority: p });
                  setPriorityPickerOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium hover:bg-bg"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: priorityColors[p] }} />
                {p}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (confirm(`Delete ${count} task${count === 1 ? "" : "s"}?`)) run({ ids, action: "delete" });
        }}
        className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-state-danger hover:border-state-danger"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <button onClick={onDone} className="ml-1 rounded-full p-1 text-text-faint hover:text-text" aria-label="Cancel selection">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
