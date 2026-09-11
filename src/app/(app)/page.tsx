"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useTasks } from "@/features/tasks/hooks";
import { useProjects } from "@/features/projects/hooks";
import { todayISO } from "@/features/app/utils/date";
import { Panel, PanelHead, PanelBody } from "@/components/ui/panel";
import { TaskList } from "@/components/tasks/task-row";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/states/skeleton";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
}

const QUOTES = [
  "Small steps make big progress.",
  "Focus on progress, not perfection.",
  "Done is better than perfect.",
  "One task at a time.",
  "Discipline beats motivation.",
];

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const today = todayISO();

  const { data: todays, isLoading: todaysLoading, isError: todaysError, refetch: refetchToday } = useTasks({ view: "today" });
  const { data: upcoming, isLoading: upcomingLoading } = useTasks({ view: "upcoming" });
  const { data: inProgress } = useTasks({ status: "IN_PROGRESS" });
  const { data: completed } = useTasks({ status: "COMPLETED" });
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const completedToday = (completed ?? []).filter(
    (t) => t.completedAt && t.completedAt.slice(0, 10) === today
  ).length;

  const stats = [
    { label: "Today", value: todays?.length ?? 0, href: "/today", grad: true },
    { label: "Upcoming", value: upcoming?.length ?? 0, href: "/upcoming" },
    { label: "In Progress", value: inProgress?.length ?? 0 },
    { label: "Completed today", value: completedToday },
  ];

  const quote = QUOTES[dayOfYear(new Date()) % QUOTES.length];
  const totalTasks = (projects ?? []).reduce((sum, p) => sum + p.taskCount, 0);
  const totalCompleted = (projects ?? []).reduce((sum, p) => sum + p.completedCount, 0);
  const overallPct = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-[22px] grid items-stretch gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="m-0 mb-1 text-[23px] tracking-tight">
            {greeting()}
            {user ? `, ${user.fullName.split(" ")[0]}` : ""} 👋
          </h2>
          <p className="m-0 text-sm text-text-secondary">Let&apos;s make today productive.</p>
        </div>
        <div className="flex flex-col justify-between gap-2.5 rounded-lg bg-brand-flow p-4 text-white shadow-[0_2px_10px_rgba(76,66,230,.28)]">
          <div>
            <div className="text-[11.5px] font-medium text-white/70">{dateLabel}</div>
            <p className="m-0 mt-1 text-[13.5px] font-semibold leading-snug">&ldquo;{quote}&rdquo;</p>
          </div>
          {!projectsLoading && totalTasks > 0 && (
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-white/80">
                <span>Overall progress</span>
                <span>{overallPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${overallPct}%` }} />
              </div>
              <div className="mt-1 text-[11px] font-medium text-white/70">
                {totalCompleted} of {totalTasks} tasks completed
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            onClick={s.href ? () => router.push(s.href!) : undefined}
            className={`rounded-lg border border-border bg-surface p-4 shadow-xs transition-all hover:-translate-y-px hover:shadow ${
              s.href ? "cursor-pointer" : ""
            }`}
          >
            <div className={`text-[26px] font-extrabold tracking-tight ${s.grad ? "bg-brand-flow bg-clip-text text-transparent" : ""}`}>
              {s.value}
            </div>
            <div className="mt-0.5 text-[12.5px] font-medium text-text-secondary">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHead title="Today's Tasks" linkLabel="View all" onLinkClick={() => router.push("/today")} />
          <PanelBody>
            <InlineComposer defaults={{ dueDate: today }} />
            <TaskList
              tasks={todays?.slice(0, 6)}
              isLoading={todaysLoading}
              isError={todaysError}
              onRetry={refetchToday}
              emptyTitle="Nothing due today"
              emptyText="Add a task above to get started."
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="My Projects" linkLabel="View all" onLinkClick={() => router.push("/projects")} />
          <PanelBody className="px-3 pb-3.5 pt-1">
            {projectsLoading && (
              <div className="flex flex-col gap-2 px-1 py-1">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {projects?.map((p) => {
              const pct = p.taskCount ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="flex cursor-pointer items-start gap-[11px] rounded-[10px] px-1 py-2.5 hover:bg-bg"
                >
                  <div
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ background: p.color ?? "#94A3B8" }}
                  >
                    {p.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.8px] font-medium text-text">{p.name}</div>
                    <div className="mt-1.5">
                      {p.taskCount ? (
                        <ProgressBar percent={pct} color={p.color ?? "#94A3B8"} />
                      ) : (
                        <span className="text-[11.5px] text-text-faint">No tasks yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </PanelBody>
        </Panel>
      </div>

      <Panel className="mt-5">
        <PanelHead title="Upcoming this week" linkLabel="Open calendar" onLinkClick={() => router.push("/calendar")} />
        <PanelBody>
          <TaskList
            tasks={upcoming?.slice(0, 5)}
            isLoading={upcomingLoading}
            emptyTitle="Nothing upcoming"
            emptyText="You are all caught up for the week."
          />
        </PanelBody>
      </Panel>
    </div>
  );
}
