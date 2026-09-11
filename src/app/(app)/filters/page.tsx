"use client";

import { useAppStore } from "@/features/app/store/app-store";
import { useTasks } from "@/features/tasks/hooks";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { TaskList } from "@/components/tasks/task-row";
import { cn } from "@/lib/utils";

const SMART_FILTERS: { id: string; name: string; query: Parameters<typeof useTasks>[0] }[] = [
  { id: "all", name: "All tasks", query: {} },
  { id: "high", name: "High priority", query: { priority: "P1" } },
  { id: "noproject", name: "No project", query: { view: "inbox" } },
  { id: "overdue", name: "Overdue", query: { view: "overdue" } },
  { id: "assigned", name: "Assigned to me", query: { view: "assigned_to_me" } },
];

export default function FiltersPage() {
  const activeFilterId = useAppStore((s) => s.activeFilterId);
  const setActiveFilter = useAppStore((s) => s.setActiveFilter);

  const filter = SMART_FILTERS.find((f) => f.id === activeFilterId) ?? SMART_FILTERS[0]!;
  const { data, isLoading, isError, refetch } = useTasks(filter.query);

  return (
    <div>
      <div className="mb-[18px] flex flex-wrap gap-2">
        {SMART_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "rounded-full border border-border bg-surface px-3 py-[7px] text-[12.5px] font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue",
              f.id === activeFilterId && "border-transparent bg-brand-flow text-white hover:text-white"
            )}
          >
            {f.name}
          </button>
        ))}
      </div>
      <InlineComposer />
      <TaskList
        tasks={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No matching tasks"
        emptyText="Try a different filter."
        allowBulkActions
      />
    </div>
  );
}
