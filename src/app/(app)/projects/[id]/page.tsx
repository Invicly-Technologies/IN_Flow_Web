"use client";

import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Paperclip, Users, UserPlus, X, Zap, Milestone as MilestoneIcon, Check, Download } from "lucide-react";
import {
  useProject,
  useProjectMembers,
  useUpdateProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useProjectAttachments,
} from "@/features/projects/hooks";
import { useWorkspaceMembers } from "@/features/workspaces/members-hooks";
import { useWorkspaces } from "@/features/workspaces/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { ProjectTab } from "@/types/domain";
import type { ProjectDTO } from "@/types/project";
import { TaskList } from "@/components/tasks/task-row";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/states/empty-state";
import { Skeleton } from "@/components/states/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/board/board-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TimelineView } from "@/components/timeline/timeline-view";
import { useAppStore } from "@/features/app/store/app-store";
import { fmtDate } from "@/features/app/utils/date";
import { cn } from "@/lib/utils";

const TABS: ProjectTab[] = ["list", "board", "calendar", "timeline", "milestones", "files", "members", "settings"];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <ProjectDetailContent params={params} />
    </Suspense>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function ProjectDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ProjectTab) || "list";

  const { data: project, isLoading, isError, refetch } = useProject(id);
  const { data: sectionlessTasks } = useTasks({ projectId: id }, { enabled: tab === "list" });

  // Only workspace admins/owners (or a super-admin) can see project Settings — everyone else
  // just gets the project's content tabs. The server enforces the same rule on the underlying
  // PATCH/DELETE routes, so this is UX (hiding a tab the request would be rejected for anyway),
  // not the actual security boundary.
  const user = useAuthStore((s) => s.user);
  const currentWorkspaceId = useAuthStore((s) => s.currentWorkspaceId);
  const { data: workspaces } = useWorkspaces();
  const myWorkspaceRole = workspaces?.find((w) => w.id === currentWorkspaceId)?.role;
  const isWorkspaceAdmin = !!user?.isSuperAdmin || myWorkspaceRole === "OWNER" || myWorkspaceRole === "ADMIN";
  const visibleTabs = isWorkspaceAdmin ? TABS : TABS.filter((t) => t !== "settings");

  function setTab(t: ProjectTab) {
    router.push(`/projects/${id}?tab=${t}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (isError || !project) {
    return (
      <EmptyState
        icon={Paperclip}
        title="Project not found"
        description="Pick a project from the sidebar."
        action={isError ? <button onClick={() => refetch()} className="text-sm font-semibold text-brand-blue">Retry</button> : undefined}
      />
    );
  }

  const noSection = (sectionlessTasks ?? []).filter((t) => !t.sectionId && t.status !== "COMPLETED");

  return (
    <div className="-mx-7 -mt-6 flex h-[calc(100%+2rem)] flex-col max-md:-mx-4 max-md:-mt-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-7 max-md:px-4">
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative top-px mr-5 whitespace-nowrap border-b-2 border-transparent py-3 text-[13.5px] font-semibold capitalize text-text-secondary",
              tab === t && "border-brand-blue text-text"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={cn("flex-1", tab === "board" ? "overflow-hidden px-5 pt-4" : "scrollbar-thin overflow-y-auto px-7 py-5 max-md:px-4")}>
        {tab === "list" && (
          <>
            <InlineComposer defaults={{ projectId: id }} />
            {project.sections.map((sec) => (
              <ProjectSectionBlock key={sec.id} projectId={id} sectionId={sec.id} name={sec.name} />
            ))}
            {noSection.length > 0 && (
              <div className="mb-1.5">
                <SectionHeader label="No section" count={noSection.length} />
                <TaskList tasks={noSection} allowBulkActions />
              </div>
            )}
          </>
        )}

        {tab === "board" && <BoardView projectId={id} />}
        {tab === "calendar" && <CalendarView projectId={id} />}
        {tab === "timeline" && <TimelineView projectId={id} />}
        {tab === "milestones" && <MilestonesTab projectId={id} />}
        {tab === "files" && <FilesTab projectId={id} />}

        {tab === "members" && <MembersTab projectId={id} />}

        {tab === "settings" && isWorkspaceAdmin && <SettingsTab project={project} />}
        {tab === "settings" && !isWorkspaceAdmin && (
          <EmptyState icon={Paperclip} title="Admins only" description="Only workspace admins can view project settings." />
        )}
      </div>
    </div>
  );
}

function ProjectSectionBlock({ projectId, sectionId, name }: { projectId: string; sectionId: string; name: string }) {
  const { data: tasks } = useTasks({ projectId, sectionId });
  const active = (tasks ?? []).filter((t) => t.status !== "COMPLETED");
  return (
    <div className="mb-1.5">
      <SectionHeader label={name} count={active.length} />
      <InlineComposer defaults={{ projectId, sectionId }} />
      <TaskList tasks={active} />
    </div>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilesTab({ projectId }: { projectId: string }) {
  const { data: attachments, isLoading } = useProjectAttachments(projectId);
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (!attachments?.length) {
    return <EmptyState icon={Paperclip} title="No files yet" description="Attachments added to tasks in this project will show up here." />;
  }
  return (
    <div className="flex flex-col gap-1">
      {attachments.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-bg">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            download={a.fileName}
            className="flex min-w-0 flex-1 items-center gap-2 text-text hover:text-brand-blue"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="truncate text-[13.5px] font-medium">{a.fileName}</span>
          </a>
          <button
            onClick={() => openTaskDetail(a.taskId)}
            className="shrink-0 truncate text-[12px] font-medium text-text-secondary hover:text-brand-blue"
            title="Open task"
          >
            {a.taskTitle}
          </button>
          <span className="shrink-0 text-[11.5px] text-text-faint">{fmtSize(a.sizeBytes)}</span>
        </div>
      ))}
    </div>
  );
}

function MilestonesTab({ projectId }: { projectId: string }) {
  const { data: milestones, isLoading } = useMilestones(projectId);
  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMilestone.mutate(
      { name: name.trim(), dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null },
      {
        onSuccess: () => {
          setAdding(false);
          setName("");
          setDueDate("");
        },
      }
    );
  }

  if (isLoading) return <Skeleton className="h-16 w-full" />;

  return (
    <div>
      {!milestones?.length && !adding ? (
        <EmptyState
          icon={MilestoneIcon}
          title="No milestones yet"
          description="Mark key dates on this project's timeline — a launch, a release, a deadline."
          action={
            <button onClick={() => setAdding(true)} className="text-sm font-semibold text-brand-blue">
              Add milestone
            </button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {milestones?.map((m) => {
              const achieved = !!m.achievedAt;
              return (
                <div key={m.id} className="group flex items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-bg">
                  <button
                    onClick={() => updateMilestone.mutate({ id: m.id, achieved: !achieved })}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                      achieved ? "border-transparent bg-state-success" : "border-border hover:border-brand-blue"
                    )}
                  >
                    {achieved && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-[13.8px] font-medium", achieved && "text-text-faint line-through")}>
                      {m.name}
                    </div>
                    <div className="text-[11.5px] text-text-secondary">
                      {m.dueDate ? fmtDate(m.dueDate.slice(0, 10)) : "No date"} · {m.taskCount} task{m.taskCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMilestone.mutate(m.id)}
                    className="rounded-md p-1.5 text-text-faint opacity-0 hover:bg-surface hover:text-state-danger group-hover:opacity-100"
                    aria-label="Delete milestone"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {adding ? (
            <form onSubmit={submit} className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Milestone name"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-brand-blue"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-brand-blue"
              />
              <button type="submit" className="rounded-lg bg-brand-flow px-2.5 py-1.5 text-xs font-semibold text-white">
                Add
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-text-secondary">
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-2 text-[12.5px] font-semibold text-text-secondary hover:text-brand-blue"
            >
              + Add milestone
            </button>
          )}
        </>
      )}
    </div>
  );
}

function MembersTab({ projectId }: { projectId: string }) {
  const { data: members, isLoading } = useProjectMembers(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const pushToast = useAppStore((s) => s.pushToast);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text-secondary">
          {members?.length ?? 0} member{members?.length === 1 ? "" : "s"}
        </span>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Add member
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !members?.length ? (
        <EmptyState icon={Users} title="No members yet" description="Members you add to this project will appear here." />
      ) : (
        <div className="flex flex-col gap-1">
          {members.map((m) => (
            <div key={m.userId} className="group flex items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-bg">
              <Avatar initials={initialsOf(m.fullName)} size={32} />
              <div className="flex-1">
                <div className="text-[13.8px] font-medium">{m.fullName}</div>
                <div className="text-[11.5px] capitalize text-text-secondary">{m.role.toLowerCase()}</div>
              </div>
              <button
                onClick={() =>
                  removeMember.mutate(m.userId, {
                    onError: () => pushToast({ message: "Couldn't remove member" }),
                  })
                }
                className="rounded-md p-1.5 text-text-faint opacity-0 hover:bg-surface hover:text-state-danger group-hover:opacity-100"
                aria-label="Remove from project"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddProjectMemberDialog projectId={projectId} open={addOpen} onOpenChange={setAddOpen} existingIds={members?.map((m) => m.userId) ?? []} />
    </div>
  );
}

function AddProjectMemberDialog({
  projectId,
  open,
  onOpenChange,
  existingIds,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIds: string[];
}) {
  const { data: workspaceMembers } = useWorkspaceMembers();
  const addMember = useAddProjectMember(projectId);
  const pushToast = useAppStore((s) => s.pushToast);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("EDITOR");

  const candidates = (workspaceMembers ?? []).filter((m) => !existingIds.includes(m.userId));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    addMember.mutate(
      { userId, role },
      {
        onSuccess: () => {
          pushToast({ message: "Member added to project" });
          onOpenChange(false);
          setUserId("");
          setRole("EDITOR");
        },
        onError: () => pushToast({ message: "Couldn't add member" }),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add member" description="Add a workspace member to this project.">
        {candidates.length === 0 ? (
          <p className="text-[13px] text-text-secondary">
            Everyone in your workspace is already on this project.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Member</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
              >
                <option value="">Select a person…</option>
                {candidates.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "EDITOR" | "VIEWER")}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <Button type="submit" disabled={!userId || addMember.isPending} className="mt-1 w-full justify-center">
              {addMember.isPending ? "Adding…" : "Add to project"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SettingsTab({ project }: { project: ProjectDTO }) {
  const updateProject = useUpdateProject(project.id);
  const pushToast = useAppStore((s) => s.pushToast);

  return (
    <div className="max-w-[420px]">
      <div className="flex items-center gap-2.5 border-b border-border py-2.5 text-[13px]">
        <span className="w-[100px] shrink-0 font-semibold text-text-secondary">Name</span>
        <span className="font-semibold">{project.name}</span>
      </div>
      <div className="flex items-center gap-2.5 border-b border-border py-2.5 text-[13px]">
        <span className="w-[100px] shrink-0 font-semibold text-text-secondary">Color</span>
        <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: project.color ?? "#94A3B8" }} />
      </div>
      <div className="flex items-center gap-2.5 border-b border-border py-2.5 text-[13px]">
        <span className="w-[100px] shrink-0 font-semibold text-text-secondary">Due date</span>
        <span className="font-semibold">{project.dueDate ? fmtDate(project.dueDate.slice(0, 10)) : "None"}</span>
      </div>

      <div className="flex items-start gap-2.5 border-b border-border py-3.5 text-[13px]">
        <span className="mt-0.5 flex w-[100px] shrink-0 items-center gap-1.5 font-semibold text-text-secondary">
          <Zap className="h-3.5 w-3.5" />
          Mode
        </span>
        <div className="flex-1">
          <button
            type="button"
            role="switch"
            aria-checked={project.isAdvanced}
            onClick={() =>
              updateProject.mutate(
                { isAdvanced: !project.isAdvanced },
                {
                  onSuccess: () =>
                    pushToast({
                      message: project.isAdvanced ? "Switched to simple to-do list" : "Advanced mode enabled",
                    }),
                  onError: () => pushToast({ message: "Couldn't update project" }),
                }
              )
            }
            disabled={updateProject.isPending}
            className={cn(
              "relative h-6 w-[42px] shrink-0 rounded-full transition-colors disabled:opacity-60",
              project.isAdvanced ? "bg-brand-flow" : "bg-border"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                project.isAdvanced ? "left-[19px]" : "left-0.5"
              )}
            />
          </button>
          <p className="mt-2 text-[12.5px] leading-snug text-text-secondary">
            {project.isAdvanced
              ? "Advanced mode is on — tasks in this project show assignee, start date, estimate and custom fields, like a lightweight project tracker."
              : "Simple mode — this project is a plain to-do list. Turn on advanced mode for assignees, start dates, estimates and custom fields."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-b border-border py-2.5 text-[13px]">
        <span className="w-[100px] shrink-0 font-semibold text-text-secondary">Archive</span>
        <span className="cursor-pointer font-semibold text-state-danger">Archive project</span>
      </div>
    </div>
  );
}
