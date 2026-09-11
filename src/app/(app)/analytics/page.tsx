"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { useTasks } from "@/features/tasks/hooks";
import { useProjects } from "@/features/projects/hooks";
import { Panel, PanelHead, PanelBody } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/states/skeleton";
import { priorityColors } from "@/lib/design-tokens";
import { todayISO } from "@/features/app/utils/date";
import type { TaskPriority } from "@prisma/client";

// A workspace-wide snapshot, computed client-side from data already fetched elsewhere in the
// app (no dedicated analytics backend) — capped at 200 tasks, so very large workspaces see a
// representative sample rather than an exact count.
const SAMPLE_LIMIT = "200";

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => todayISO(-(6 - i)));
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: allTasks, isLoading } = useTasks({ limit: SAMPLE_LIMIT });
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const stats = useMemo(() => {
    const tasks = allTasks ?? [];
    const completed = tasks.filter((t) => t.status === "COMPLETED");
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
    const overdue = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueAt && t.dueAt.slice(0, 10) < todayISO()
    );
    const byPriority: Record<TaskPriority, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    for (const t of tasks) {
      if (t.status === "COMPLETED" || t.status === "CANCELLED") continue;
      byPriority[t.priority]++;
    }
    const days = last7Days();
    const completedByDay = days.map((iso) => ({
      iso,
      count: completed.filter((t) => t.completedAt?.slice(0, 10) === iso).length,
    }));
    return { tasks, completed, inProgress, overdue, byPriority, completedByDay };
  }, [allTasks]);

  const completionPct = stats.tasks.length ? Math.round((stats.completed.length / stats.tasks.length) * 100) : 0;
  const maxDayCount = Math.max(1, ...stats.completedByDay.map((d) => d.count));

  const TILES = [
    { label: "Total tasks", value: stats.tasks.length, icon: Circle, color: "#94A3B8" },
    { label: "Completed", value: stats.completed.length, icon: CheckCircle2, color: "#10B981" },
    { label: "In progress", value: stats.inProgress.length, icon: Clock, color: "#315CFF" },
    { label: "Overdue", value: stats.overdue.length, icon: AlertTriangle, color: "#EF4444" },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {TILES.map((t) => (
          <div key={t.label} className="rounded-lg border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center gap-1.5">
              <t.icon className="h-4 w-4" style={{ color: t.color }} />
              <div className="text-[26px] font-extrabold tracking-tight">{isLoading ? "–" : t.value}</div>
            </div>
            <div className="mt-0.5 text-[12.5px] font-medium text-text-secondary">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Panel>
          <PanelHead title="Completed in the last 7 days" />
          <PanelBody className="px-4 pb-4 pt-1">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="flex h-32 items-end gap-2.5">
                {stats.completedByDay.map((d) => (
                  <div key={d.iso} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end">
                      <div
                        className="w-full rounded-t-[4px] bg-brand-flow transition-[height]"
                        style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: d.count ? 4 : 0 }}
                        title={`${d.count} completed`}
                      />
                    </div>
                    <span className="text-[10.5px] font-semibold text-text-faint">
                      {new Date(d.iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 border-t border-border pt-2.5 text-[12.5px] text-text-secondary">
              {completionPct}% of sampled tasks are complete overall.
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Open tasks by priority" />
          <PanelBody className="px-4 pb-4 pt-1">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="flex flex-col gap-2.5">
                {(["P1", "P2", "P3", "P4"] as TaskPriority[]).map((p) => {
                  const count = stats.byPriority[p];
                  const openTotal = Math.max(1, stats.tasks.length - stats.completed.length);
                  const pct = Math.round((count / openTotal) * 100);
                  return (
                    <div key={p} className="flex items-center gap-2.5">
                      <span className="w-8 shrink-0 text-[11.5px] font-bold" style={{ color: priorityColors[p] }}>
                        {p}
                      </span>
                      <div className="flex-1">
                        <ProgressBar percent={pct} color={priorityColors[p]} />
                      </div>
                      <span className="w-6 shrink-0 text-right text-[11.5px] font-semibold text-text-secondary">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel className="mt-5">
        <PanelHead title="Progress by project" linkLabel="View all" onLinkClick={() => router.push("/projects")} />
        <PanelBody className="px-3 pb-3.5 pt-1">
          {projectsLoading && (
            <div className="flex flex-col gap-2 px-1 py-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!projectsLoading && !projects?.length && (
            <div className="px-1 py-3 text-[13px] text-text-secondary">No projects yet.</div>
          )}
          {projects?.map((p) => {
            const pct = p.taskCount ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
            return (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-bg"
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
                <div className="w-[70px] shrink-0 text-right text-[12px] font-semibold text-text-secondary">
                  {p.completedCount}/{p.taskCount} · {pct}%
                </div>
              </div>
            );
          })}
        </PanelBody>
      </Panel>
    </div>
  );
}
