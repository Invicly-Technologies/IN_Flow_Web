"use client";

import { useMemo, useState } from "react";
import { useTasks } from "@/features/tasks/hooks";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { TaskList } from "@/components/tasks/task-row";
import { dateOnly, todayISO } from "@/features/app/utils/date";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/types/task";

type TabId = "all" | "unsorted" | "today" | "week" | "later" | "completed";

export default function InboxPage() {
  const [tab, setTab] = useState<TabId>("all");
  const { data: active, isLoading, isError, refetch } = useTasks({ view: "inbox" });
  const { data: completedAll } = useTasks({ status: "COMPLETED" }, { enabled: tab === "completed" });
  const completed = useMemo(() => (completedAll ?? []).filter((t) => !t.projectId), [completedAll]);

  const today = todayISO();
  const weekEnd = todayISO(7);

  const buckets = useMemo(() => {
    const tasks = active ?? [];
    const unsorted: TaskDTO[] = [];
    const dueToday: TaskDTO[] = [];
    const dueThisWeek: TaskDTO[] = [];
    const later: TaskDTO[] = [];
    for (const t of tasks) {
      const due = dateOnly(t.dueAt);
      if (!due) unsorted.push(t);
      else if (due <= today) dueToday.push(t);
      else if (due <= weekEnd) dueThisWeek.push(t);
      else later.push(t);
    }
    return { all: tasks, unsorted, today: dueToday, week: dueThisWeek, later };
  }, [active, today, weekEnd]);

  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: buckets.all.length },
    { id: "unsorted", label: "Unsorted", count: buckets.unsorted.length },
    { id: "today", label: "Today", count: buckets.today.length },
    { id: "week", label: "This week", count: buckets.week.length },
    { id: "later", label: "Later", count: buckets.later.length },
    { id: "completed", label: "Completed", count: completed.length },
  ];

  const visibleTasks = tab === "completed" ? completed : buckets[tab];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-[7px] text-[12.5px] font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue",
              tab === t.id && "border-transparent bg-brand-flow text-white hover:text-white"
            )}
          >
            {t.label}
            <span className={cn("text-[11px] font-bold opacity-70", tab === t.id && "opacity-90")}>({t.count})</span>
          </button>
        ))}
      </div>

      {tab !== "completed" && <InlineComposer />}
      <TaskList
        tasks={visibleTasks}
        isLoading={tab === "completed" ? !completedAll : isLoading}
        isError={tab !== "completed" && isError}
        onRetry={refetch}
        emptyTitle={tab === "completed" ? "Nothing completed yet" : "Inbox zero"}
        emptyText={tab === "completed" ? "Tasks you finish land here." : "Tasks without a project land here."}
        allowBulkActions={tab !== "completed"}
      />
    </div>
  );
}
