"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useProjects } from "@/features/projects/hooks";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/states/skeleton";
import { ErrorState } from "@/components/states/error-state";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] w-full" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState title="Couldn't load projects" onRetry={() => refetch()} />;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
      {projects?.map((p) => {
        const pct = p.taskCount ? Math.round((p.completedCount / p.taskCount) * 100) : 0;
        return (
          <div
            key={p.id}
            onClick={() => router.push(`/projects/${p.id}`)}
            className="cursor-pointer rounded-lg border border-border bg-surface p-4 shadow-xs transition-all hover:-translate-y-px hover:shadow"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] font-bold text-white"
                style={{ background: p.color ?? "#94A3B8" }}
              >
                {p.icon}
              </div>
              <div className="text-[14.5px] font-bold">{p.name}</div>
            </div>
            <p className="mb-3 min-h-4 text-xs text-text-secondary">{p.description}</p>
            {p.taskCount ? (
              <>
                <div className="mb-2">
                  <ProgressBar percent={pct} color={p.color ?? "#94A3B8"} />
                </div>
                <div className="flex justify-between text-[11.5px] font-semibold text-text-secondary">
                  <span>{pct}% complete</span>
                  <span>{p.taskCount} tasks</span>
                </div>
              </>
            ) : (
              <div className="text-[11.5px] font-semibold text-text-faint">No tasks yet</div>
            )}
          </div>
        );
      })}
      <div
        onClick={() => setDialogOpen(true)}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 text-text-secondary"
      >
        <div className="mb-2 flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-dashed border-text-faint">
          <Plus className="h-4 w-4" />
        </div>
        <div className="text-[13px] font-semibold">New project</div>
      </div>

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
