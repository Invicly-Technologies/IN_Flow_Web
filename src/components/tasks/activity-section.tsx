"use client";

import { useTaskActivity } from "@/features/tasks/hooks";

const ACTION_LABELS: Record<string, string> = {
  created: "created this task",
  updated: "updated this task",
  completed: "completed this task",
  reopened: "reopened this task",
  deleted: "deleted this task",
  dependency_added: "added a dependency",
  attachment_added: "attached a file",
};

function describe(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

/** Rendered only while its tab is active in the task detail panel, so it fetches on mount rather than behind its own collapse toggle. */
export function ActivitySection({ taskId }: { taskId: string }) {
  const { data: entries } = useTaskActivity(taskId);

  if (!entries?.length) return <div className="py-3 text-xs text-text-secondary">No activity recorded yet.</div>;
  return (
    <div>
      {entries.map((e) => (
        <div key={e.id} className="flex items-center gap-2 py-1.5 text-[12.5px] text-text-secondary">
          <span className="font-semibold text-text">{e.actorName}</span>
          <span className="flex-1 truncate">{describe(e.action)}</span>
          <span className="shrink-0 text-[11px] text-text-faint">
            {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}
