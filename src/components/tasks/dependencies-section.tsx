"use client";

import { useState } from "react";
import { X, Plus, Ban, ArrowRight } from "lucide-react";
import type { TaskDTO, TaskLinkDTO } from "@/types/task";
import { useTasks, useAddDependency, useRemoveDependency } from "@/features/tasks/hooks";
import { cn } from "@/lib/utils";

function LinkRow({ link, onRemove }: { link: TaskLinkDTO; onRemove?: () => void }) {
  const done = link.status === "COMPLETED" || link.status === "CANCELLED";
  return (
    <div className="flex items-center gap-[9px] py-1.5 text-[13.5px]">
      <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", done ? "bg-state-success" : "bg-state-warning")} />
      <span className={cn("flex-1 truncate", done && "text-text-faint line-through")}>{link.title}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-text-faint hover:text-state-danger" aria-label="Remove dependency">
          <X className="h-[14px] w-[14px]" />
        </button>
      )}
    </div>
  );
}

export function DependenciesSection({ task }: { task: TaskDTO }) {
  const addDependency = useAddDependency();
  const removeDependency = useRemoveDependency();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const { data: matches } = useTasks({ q: query }, { enabled: picking && query.trim().length > 1 });

  const excludeIds = new Set([task.id, ...task.blockedBy.map((b) => b.taskId)]);
  const candidates = (matches ?? []).filter((t) => !excludeIds.has(t.id)).slice(0, 6);

  if (task.blockedBy.length === 0 && task.blocking.length === 0 && !picking) {
    return (
      <div>
        <div className="flex items-center gap-2 py-1.5 text-[13px] font-bold text-text-secondary">
          <Ban className="h-[13px] w-[13px]" />
          <span>Dependencies</span>
        </div>
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-[9px] py-1.5 text-[13.5px] font-semibold text-text-secondary hover:text-brand-blue"
        >
          <Plus className="h-[15px] w-[15px]" />
          Mark as blocked by another task
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 text-[13px] font-bold text-text-secondary">
        <Ban className="h-[13px] w-[13px]" />
        <span>Dependencies</span>
      </div>

      {task.blockedBy.length > 0 && (
        <div className="mb-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Blocked by</div>
          {task.blockedBy.map((link) => (
            <LinkRow
              key={link.linkId}
              link={link}
              onRemove={() => removeDependency.mutate({ taskId: task.id, dependencyId: link.linkId })}
            />
          ))}
        </div>
      )}

      {task.blocking.length > 0 && (
        <div className="mb-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Blocking</div>
          {task.blocking.map((link) => (
            <LinkRow key={link.linkId} link={link} />
          ))}
        </div>
      )}

      {picking ? (
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-[13px] w-[13px] shrink-0 text-text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a task…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-brand-blue"
            />
            <button onClick={() => setPicking(false)} className="text-xs font-semibold text-text-secondary">
              Cancel
            </button>
          </div>
          {candidates.length > 0 && (
            <div className="mt-1.5 rounded-lg border border-border bg-surface">
              {candidates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    addDependency.mutate({ taskId: task.id, blockerTaskId: t.id });
                    setPicking(false);
                    setQuery("");
                  }}
                  className="cursor-pointer truncate px-2.5 py-1.5 text-[13px] hover:bg-bg"
                >
                  {t.title}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="mt-1 flex items-center gap-[9px] py-1 text-[12.5px] font-semibold text-text-secondary hover:text-brand-blue"
        >
          <Plus className="h-[13px] w-[13px]" />
          Add blocking task
        </button>
      )}
    </div>
  );
}
