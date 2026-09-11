"use client";

import { CalendarRange } from "lucide-react";
import { useTasks } from "@/features/tasks/hooks";
import { todayISO, fmtDate } from "@/features/app/utils/date";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { TaskList } from "@/components/tasks/task-row";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { TaskListSkeleton } from "@/components/states/skeleton";

export default function UpcomingPage() {
  const { data: upcoming, isLoading, isError, refetch } = useTasks({ view: "upcoming" });

  const groups = new Map<string, NonNullable<typeof upcoming>>();
  (upcoming ?? [])
    .slice()
    .sort((a, b) => (a.dueAt! < b.dueAt! ? -1 : 1))
    .forEach((t) => {
      const key = t.dueAt!.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), t]);
    });
  const dates = [...groups.keys()].sort();

  return (
    <div>
      <InlineComposer defaults={{ dueDate: todayISO(1) }} />
      {isLoading && <TaskListSkeleton />}
      {isError && <ErrorState title="Couldn't load upcoming tasks" onRetry={() => refetch()} />}
      {!isLoading && !isError && dates.length === 0 && (
        <EmptyState icon={CalendarRange} title="Nothing scheduled" description="Tasks with future due dates will appear here." />
      )}
      {!isLoading &&
        !isError &&
        dates.map((date) => (
          <div key={date}>
            <SectionHeader label={fmtDate(date, { weekday: "long", month: "short", day: "numeric" })} count={groups.get(date)!.length} />
            <TaskList tasks={groups.get(date)!} />
          </div>
        ))}
    </div>
  );
}
