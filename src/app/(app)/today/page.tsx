"use client";

import { useTasks } from "@/features/tasks/hooks";
import { todayISO } from "@/features/app/utils/date";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { TaskList } from "@/components/tasks/task-row";
import { SectionHeader } from "@/components/ui/section-header";

export default function TodayPage() {
  const today = todayISO();
  const { data: overdue, isLoading: overdueLoading } = useTasks({ view: "overdue" });
  const { data: dueToday, isLoading: dueTodayLoading, isError, refetch } = useTasks({ view: "today" });

  return (
    <div>
      <InlineComposer defaults={{ dueDate: today }} />
      {!!overdue?.length && (
        <>
          <SectionHeader label="Overdue" count={overdue.length} />
          <TaskList tasks={overdue} isLoading={overdueLoading} />
        </>
      )}
      <SectionHeader
        label={`Today · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`}
        count={dueToday?.length ?? 0}
      />
      <TaskList
        tasks={dueToday}
        isLoading={dueTodayLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="Nothing due today"
        emptyText="Enjoy a lighter day."
        allowBulkActions
      />
    </div>
  );
}
