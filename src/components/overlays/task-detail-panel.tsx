"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { X, Trash2, Bell, Plus, Repeat, Ban, Check, Flag } from "lucide-react";
import type { TaskPriority } from "@prisma/client";
import { useAppStore } from "@/features/app/store/app-store";
import {
  useTask,
  useTasks,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useReopenTask,
  useUpdateChecklistItem,
  useAddComment,
} from "@/features/tasks/hooks";
import { useProjects, useMilestones } from "@/features/projects/hooks";
import { useLabels } from "@/features/labels/hooks";
import { useReminders, useCreateReminder, useDeleteReminder } from "@/features/reminders/hooks";
import { useCustomFields, useSetTaskCustomFieldValues } from "@/features/custom-fields/hooks";
import { TaskCheckbox } from "@/components/ui/task-checkbox";
import { TaskList } from "@/components/tasks/task-row";
import { InlineComposer } from "@/components/tasks/inline-composer";
import { AssigneeSelect, AssigneeAvatar } from "@/components/tasks/assignee-picker";
import { DependenciesSection } from "@/components/tasks/dependencies-section";
import { TimeTrackingSection } from "@/components/tasks/time-tracking-section";
import { AttachmentsSection } from "@/components/tasks/attachments-section";
import { ActivitySection } from "@/components/tasks/activity-section";
import { dateOnly, toISODateTime } from "@/features/app/utils/date";
import { priorityColors, statusColors } from "@/lib/design-tokens";
import type { TaskRecurrenceDTO } from "@/types/task";
import { cn } from "@/lib/utils";

const RECURRENCE_OPTIONS: { value: TaskRecurrenceDTO["frequency"]; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

const STATUS_OPTIONS: { value: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function TaskDetailPanel() {
  const detailTaskId = useAppStore((s) => s.detailTaskId);
  const closeTaskDetail = useAppStore((s) => s.closeTaskDetail);
  const pushToast = useAppStore((s) => s.pushToast);

  const { data: task, isLoading } = useTask(detailTaskId);
  const { data: subtasks } = useTasks(detailTaskId ? { parentTaskId: detailTaskId } : {});
  const { data: projects } = useProjects();
  const { data: labels = [] } = useLabels();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const complete = useCompleteTask();
  const reopen = useReopenTask();
  const updateChecklistItem = useUpdateChecklistItem();
  const addComment = useAddComment();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentDraft, setCommentDraft] = useState("");

  // Deliberately narrow deps: resync only when switching tasks or when the server
  // value actually changes, never merely because the `task` object reference changed
  // (e.g. a background refetch) — that would clobber in-progress unsaved typing.
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.title, task?.description]);

  const show = !!detailTaskId;
  const project = projects?.find((p) => p.id === task?.projectId);

  const subtaskTotal = (subtasks?.length ?? 0) + (task?.checklist.length ?? 0);
  const subtaskDone =
    (subtasks?.filter((t) => t.status === "COMPLETED").length ?? 0) + (task?.checklist.filter((c) => c.done).length ?? 0);
  const subtaskPct = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0;

  // Shared onError for every updateTask.mutate call below — most commonly hit when the
  // task's cached version has drifted (e.g. a background refetch beat this edit in).
  function onSaveError() {
    pushToast({ message: "Couldn't save your change — reload and try again" });
  }

  function submitComment() {
    if (!task || !commentDraft.trim()) return;
    addComment.mutate({ taskId: task.id, body: commentDraft.trim() });
    setCommentDraft("");
  }

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[80] bg-navy/35 opacity-0 transition-opacity duration-200",
          show && "pointer-events-auto opacity-100"
        )}
        onClick={closeTaskDetail}
      />
      <div
        className={cn(
          "fixed right-0 top-0 z-[90] flex h-screen w-full translate-x-full flex-col bg-surface shadow-[-16px_0_40px_rgba(0,0,0,.15)] transition-transform duration-200 ease-out sm:w-[440px] lg:w-[900px] lg:max-w-[95vw]",
          show && "translate-x-0"
        )}
      >
        {show && (
          <>
            <div className="flex items-center gap-2 border-b border-border p-3.5">
              <button
                onClick={closeTaskDetail}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-border text-text-secondary hover:bg-bg"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  title="Delete task"
                  onClick={() => {
                    if (!task) return;
                    deleteTask.mutate(task.id, {
                      onSuccess: () => {
                        closeTaskDetail();
                        pushToast({ message: "Task deleted" });
                      },
                    });
                  }}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-border text-text-secondary hover:bg-bg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isLoading || !task ? (
              <div className="flex-1 animate-pulse space-y-3 px-5 pt-5">
                <div className="h-6 w-3/4 rounded bg-border" />
                <div className="h-4 w-full rounded bg-border" />
                <div className="h-4 w-2/3 rounded bg-border" />
              </div>
            ) : (
              <div className="scrollbar-thin flex-1 pb-10">
                <div className="px-5 pt-[18px]">
                  {project?.key && task.number != null && (
                    <div className="mb-1.5 font-mono text-[11.5px] font-bold text-text-faint">
                      {project.key}-{task.number}
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <div className="mt-[7px]">
                      <TaskCheckbox
                        done={task.status === "COMPLETED"}
                        priority={task.priority}
                        onClick={() =>
                          task.status === "COMPLETED"
                            ? reopen.mutate(task.id, {
                                onError: (err) =>
                                  pushToast({ message: err instanceof Error ? err.message : "Couldn't reopen task" }),
                              })
                            : complete.mutate(task.id, {
                                onError: (err) =>
                                  pushToast({ message: err instanceof Error ? err.message : "Couldn't complete task" }),
                              })
                        }
                      />
                    </div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => {
                        if (title.trim() && title !== task.title) {
                          updateTask.mutate(
                            { id: task.id, version: task.version, title: title.trim() },
                            { onError: () => pushToast({ message: "Couldn't save title — please retry" }) }
                          );
                        }
                      }}
                      className="w-full border-none bg-transparent text-xl font-bold text-text outline-none sm:text-2xl"
                    />
                  </div>
                  {task.isBlocked && (
                    <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-state-danger/10 px-2.5 py-1.5 text-[12px] font-semibold text-[#C23434]">
                      <Ban className="h-3.5 w-3.5 shrink-0" />
                      Blocked by {task.blockedBy.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length} incomplete task(s)
                    </div>
                  )}
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => {
                      if (description !== (task.description ?? "")) {
                        updateTask.mutate({ id: task.id, version: task.version, description }, { onError: onSaveError });
                      }
                    }}
                    placeholder="Add description..."
                    rows={2}
                    className="mb-1 mt-2.5 w-full resize-none border-none bg-transparent font-sans text-[13.5px] text-text-secondary outline-none"
                  />
                </div>

                {/* Two-column body: main content (~2/3) + property rail (~1/3). Stacks below lg. */}
                <div className="mt-4 grid grid-cols-1 gap-6 px-5 lg:grid-cols-3">
                  <div className="min-w-0 space-y-6 lg:col-span-2">
                    <section>
                      <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-text-secondary">
                        <span>Subtasks</span>
                        {subtaskTotal > 0 && (
                          <span className="font-medium text-text-faint">
                            {subtaskDone}/{subtaskTotal}
                          </span>
                        )}
                      </div>
                      {subtaskTotal > 0 && (
                        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                          <div className="h-full rounded-full bg-brand-flow transition-all" style={{ width: `${subtaskPct}%` }} />
                        </div>
                      )}
                      <TaskList tasks={subtasks} />
                      <InlineComposer defaults={{ projectId: task.projectId, parentTaskId: task.id }} />

                      {task.checklist.length > 0 && (
                        <div className="mt-4">
                          <div className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">Checklist</div>
                          {task.checklist.map((c) => (
                            <div key={c.id} className="flex items-center gap-[9px] py-1.5 text-[13.5px]">
                              <TaskCheckbox
                                done={c.done}
                                priority="P4"
                                size={16}
                                onClick={() => updateChecklistItem.mutate({ taskId: task.id, itemId: c.id, done: !c.done })}
                              />
                              <span className={cn(c.done && "text-text-faint line-through")}>{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section>
                      <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-text-secondary">
                        <span>Comments</span>
                        {task.comments.length > 0 && <span className="font-medium text-text-faint">{task.comments.length}</span>}
                      </div>
                      {task.comments.length ? (
                        task.comments.map((c) => (
                          <div key={c.id} className="py-2 text-[12.5px]">
                            <b>{c.authorName}</b>
                            <div className="text-text-secondary">{c.body}</div>
                          </div>
                        ))
                      ) : (
                        <div className="py-1.5 pb-3 text-xs text-text-secondary">No comments yet.</div>
                      )}
                      <div className="mt-1.5 flex gap-2">
                        <input
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitComment();
                          }}
                          placeholder="Write a comment…"
                          className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] text-text outline-none"
                        />
                        <button
                          onClick={submitComment}
                          className="rounded-[9px] bg-brand-flow px-2.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90"
                        >
                          Send
                        </button>
                      </div>
                    </section>

                    <section>
                      <div className="mb-2 text-[13px] font-bold text-text-secondary">Activity</div>
                      <ActivitySection taskId={task.id} />
                    </section>
                  </div>

                  <aside className="min-w-0 space-y-4 rounded-xl bg-surface2 p-4 lg:col-span-1 lg:self-start">
                    <RailBlock first>
                      <Field label="Status">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTask.mutate(
                              { id: task.id, version: task.version, status: e.target.value as typeof task.status },
                              { onError: onSaveError }
                            )
                          }
                          style={{ background: `${statusColors[task.status]}20`, color: statusColors[task.status] }}
                          className="w-full cursor-pointer rounded-full border-none px-2.5 py-1 text-[12px] font-bold outline-none"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </RailBlock>

                    {project?.isAdvanced && (
                      <RailBlock>
                        <Field label="Assignee">
                          <div className="flex items-center gap-2">
                            {task.assigneeId && <AssigneeAvatar userId={task.assigneeId} size={20} />}
                            <AssigneeSelect
                              value={task.assigneeId}
                              onChange={(assigneeId) =>
                                updateTask.mutate({ id: task.id, version: task.version, assigneeId }, { onError: onSaveError })
                              }
                              className="flex-1 border-none bg-transparent text-[13px] font-semibold text-text outline-none"
                            />
                          </div>
                        </Field>
                      </RailBlock>
                    )}

                    <RailBlock>
                      <Field label="Due date">
                        <input
                          type="date"
                          value={dateOnly(task.dueAt) ?? ""}
                          onChange={(e) =>
                            updateTask.mutate(
                              { id: task.id, version: task.version, dueAt: e.target.value ? toISODateTime(e.target.value) : null },
                              { onError: onSaveError }
                            )
                          }
                          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-[13px] font-semibold text-text outline-none focus:border-brand-blue"
                        />
                      </Field>
                    </RailBlock>

                    <RailBlock>
                      <Field label="Priority">
                        <div className="relative flex items-center">
                          <Flag className="pointer-events-none absolute left-0 h-3.5 w-3.5" style={{ color: priorityColors[task.priority] }} />
                          <select
                            value={task.priority}
                            onChange={(e) =>
                              updateTask.mutate(
                                { id: task.id, version: task.version, priority: e.target.value as TaskPriority },
                                { onError: onSaveError }
                              )
                            }
                            style={{ color: priorityColors[task.priority] }}
                            className="w-full border-none bg-transparent py-0.5 pl-5 text-[13px] font-semibold outline-none"
                          >
                            <option value="P1">P1 — Urgent</option>
                            <option value="P2">P2 — High</option>
                            <option value="P3">P3 — Medium</option>
                            <option value="P4">P4 — Low</option>
                          </select>
                        </div>
                      </Field>
                    </RailBlock>

                    <RailBlock>
                      <Field label="Labels">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button className="flex w-full flex-wrap items-center gap-[5px] text-left">
                              {task.labels.length ? (
                                task.labels.map((label) => {
                                  const color = label.color ?? "#315CFF";
                                  return (
                                    <span
                                      key={label.id}
                                      className="rounded-full px-2 py-[2px] text-[10.5px] font-semibold"
                                      style={{ background: `${color}24`, color }}
                                    >
                                      {label.name}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[13px] font-semibold text-text-faint">Add labels</span>
                              )}
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content
                              align="start"
                              sideOffset={6}
                              className="z-[120] min-w-[170px] rounded-[10px] border border-border bg-surface p-1.5 shadow-lg"
                            >
                              {labels.length === 0 && (
                                <div className="px-[9px] py-1.5 text-[12.5px] text-text-faint">No labels yet</div>
                              )}
                              {labels.map((l) => {
                                const checked = task.labels.some((tl) => tl.id === l.id);
                                return (
                                  <div
                                    key={l.id}
                                    onClick={() =>
                                      updateTask.mutate(
                                        {
                                          id: task.id,
                                          version: task.version,
                                          labelIds: checked
                                            ? task.labels.filter((tl) => tl.id !== l.id).map((tl) => tl.id)
                                            : [...task.labels.map((tl) => tl.id), l.id],
                                        },
                                        { onError: onSaveError }
                                      )
                                    }
                                    className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] px-[9px] py-[7px] text-[13px] font-medium hover:bg-bg"
                                  >
                                    <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: l.color ?? "#315CFF" }} />
                                    <span className="flex-1">{l.name}</span>
                                    {checked && <Check className="h-3 w-3 shrink-0" />}
                                  </div>
                                );
                              })}
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      </Field>
                    </RailBlock>

                    <RailBlock>
                      <Field label="Project">
                        <div className="relative flex items-center">
                          <span
                            className="absolute left-0 h-[7px] w-[7px] shrink-0 rounded-[2px]"
                            style={{ background: project?.color ?? "#94A3B8" }}
                          />
                          <select
                            value={task.projectId ?? ""}
                            onChange={(e) =>
                              updateTask.mutate(
                                { id: task.id, version: task.version, projectId: e.target.value || null },
                                { onError: onSaveError }
                              )
                            }
                            className="w-full border-none bg-transparent py-0.5 pl-4 text-[13px] font-semibold text-text outline-none"
                          >
                            <option value="">Inbox</option>
                            {projects?.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Field>
                    </RailBlock>

                    {task.projectId && (
                      <RailBlock>
                        <MilestoneField task={task} projectId={task.projectId} />
                      </RailBlock>
                    )}

                    <RailBlock>
                      <RecurrenceField task={task} />
                    </RailBlock>

                    {project?.isAdvanced && (
                      <>
                        <RailBlock>
                          <Field label="Start date">
                            <input
                              type="date"
                              defaultValue={task.startAt ? dateOnly(task.startAt)! : ""}
                              onChange={(e) =>
                                updateTask.mutate(
                                  {
                                    id: task.id,
                                    version: task.version,
                                    startAt: e.target.value ? toISODateTime(e.target.value) : null,
                                  },
                                  { onError: onSaveError }
                                )
                              }
                              className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-[13px] font-semibold text-text outline-none focus:border-brand-blue"
                            />
                          </Field>
                        </RailBlock>
                        <RailBlock>
                          <Field label="Estimate">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                defaultValue={task.durationMinutes ?? ""}
                                placeholder="Minutes"
                                onBlur={(e) =>
                                  updateTask.mutate(
                                    {
                                      id: task.id,
                                      version: task.version,
                                      durationMinutes: e.target.value ? Number(e.target.value) : null,
                                    },
                                    { onError: onSaveError }
                                  )
                                }
                                className="w-20 border-none bg-transparent text-[13px] font-semibold text-text outline-none"
                              />
                              <span className="text-text-faint">min</span>
                            </div>
                          </Field>
                        </RailBlock>
                      </>
                    )}

                    <CustomFieldsFields taskId={task.id} values={task.customFields} />

                    <RailBlock>
                      <DependenciesSection task={task} />
                    </RailBlock>

                    <RailBlock>
                      <AttachmentsSection task={task} />
                    </RailBlock>

                    <RailBlock>
                      <TimeTrackingSection task={task} />
                    </RailBlock>

                    <RailBlock>
                      <RemindersSection taskId={task.id} />
                    </RailBlock>
                  </aside>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** Vertical divider between rail rows — first item skips the top border/padding. */
function RailBlock({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return <div className={cn("border-t border-border pt-4", first && "border-t-0 pt-0")}>{children}</div>;
}

function MilestoneField({ task, projectId }: { task: { id: string; version: number; milestoneId: string | null }; projectId: string }) {
  const { data: milestones } = useMilestones(projectId);
  const updateTask = useUpdateTask();
  const pushToast = useAppStore((s) => s.pushToast);

  if (!milestones?.length) return null;

  return (
    <Field label="Milestone">
      <select
        value={task.milestoneId ?? ""}
        onChange={(e) =>
          updateTask.mutate(
            { id: task.id, version: task.version, milestoneId: e.target.value || null },
            { onError: () => pushToast({ message: "Couldn't save milestone — reload and try again" }) }
          )
        }
        className="w-full border-none bg-transparent text-[13px] font-semibold text-text outline-none"
      >
        <option value="">None</option>
        {milestones.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function RecurrenceField({ task }: { task: { id: string; version: number; recurrence: TaskRecurrenceDTO | null } }) {
  const updateTask = useUpdateTask();
  const pushToast = useAppStore((s) => s.pushToast);
  const [editing, setEditing] = useState(false);
  const [frequency, setFrequency] = useState<TaskRecurrenceDTO["frequency"]>(task.recurrence?.frequency ?? "WEEKLY");
  const [interval, setIntervalValue] = useState(task.recurrence?.interval ?? 1);

  function onError() {
    pushToast({ message: "Couldn't save repeat schedule — reload and try again" });
  }

  function save() {
    updateTask.mutate(
      { id: task.id, version: task.version, recurrence: { frequency, interval, byWeekday: [] } },
      { onError }
    );
    setEditing(false);
  }

  return (
    <Field label="Repeat">
      {editing ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>Every</span>
          <input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setIntervalValue(Number(e.target.value) || 1)}
            className="w-12 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[13px] outline-none"
          />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as TaskRecurrenceDTO["frequency"])}
            className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[13px] outline-none"
          >
            {RECURRENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button onClick={save} className="rounded-md bg-brand-flow px-2 py-0.5 text-xs font-semibold text-white">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="text-xs font-semibold text-text-secondary">
            Cancel
          </button>
        </div>
      ) : task.recurrence ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <Repeat className="h-3 w-3" />
            Every {task.recurrence.interval > 1 ? `${task.recurrence.interval} ` : ""}
            {RECURRENCE_OPTIONS.find((o) => o.value === task.recurrence!.frequency)?.label.toLowerCase()}
          </span>
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-brand-blue">
            Edit
          </button>
          <button
            onClick={() => updateTask.mutate({ id: task.id, version: task.version, recurrence: null }, { onError })}
            className="text-xs font-semibold text-text-secondary"
          >
            Remove
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-[13px] font-semibold text-text-secondary hover:text-brand-blue">
          Doesn&apos;t repeat
        </button>
      )}
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-[13px]">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text-faint">{label}</div>
      <div className="font-semibold text-text">{children}</div>
    </div>
  );
}

function CustomFieldsFields({
  taskId,
  values,
}: {
  taskId: string;
  values: { fieldId: string; value: string | number | boolean | null }[];
}) {
  const { data: fields } = useCustomFields();
  const setValues = useSetTaskCustomFieldValues(taskId);
  const pushToast = useAppStore((s) => s.pushToast);

  if (!fields?.length) return null;

  function valueFor(fieldId: string) {
    return values.find((v) => v.fieldId === fieldId)?.value ?? null;
  }

  function save(fieldId: string, value: string | number | boolean | null) {
    setValues.mutate([{ fieldId, value }], {
      onError: () => pushToast({ message: "Couldn't save field — please retry" }),
    });
  }

  return (
    <>
      {fields.map((f) => {
        const current = valueFor(f.id);
        return (
          <RailBlock key={f.id}>
            <Field label={f.name}>
              {f.type === "TEXT" && (
                <input
                  defaultValue={(current as string) ?? ""}
                  onBlur={(e) => save(f.id, e.target.value || null)}
                  className="w-full border-none bg-transparent text-[13px] font-semibold text-text outline-none"
                />
              )}
              {f.type === "NUMBER" && (
                <input
                  type="number"
                  defaultValue={current === null ? "" : (current as number)}
                  onBlur={(e) => save(f.id, e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full border-none bg-transparent text-[13px] font-semibold text-text outline-none"
                />
              )}
              {f.type === "DATE" && (
                <input
                  type="date"
                  defaultValue={(current as string) ?? ""}
                  onChange={(e) => save(f.id, e.target.value || null)}
                  className="border-none bg-transparent text-[13px] font-semibold text-text outline-none"
                />
              )}
              {f.type === "CHECKBOX" && (
                <input
                  type="checkbox"
                  defaultChecked={!!current}
                  onChange={(e) => save(f.id, e.target.checked)}
                  className="h-4 w-4 accent-brand-blue"
                />
              )}
              {f.type === "SELECT" && (
                <select
                  defaultValue={(current as string) ?? ""}
                  onChange={(e) => save(f.id, e.target.value || null)}
                  className="border-none bg-transparent text-[13px] font-semibold text-text outline-none"
                >
                  <option value="">—</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </RailBlock>
        );
      })}
    </>
  );
}

function reminderPresets(): { label: string; date: () => Date }[] {
  return [
    {
      label: "Later today (3pm)",
      date: () => {
        const d = new Date();
        d.setHours(15, 0, 0, 0);
        return d;
      },
    },
    {
      label: "Tomorrow, 9am",
      date: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
      },
    },
    {
      label: "Next week, 9am",
      date: () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(9, 0, 0, 0);
        return d;
      },
    },
  ];
}

function RemindersSection({ taskId }: { taskId: string }) {
  const pushToast = useAppStore((s) => s.pushToast);
  const { data: reminders } = useReminders(taskId);
  const createReminder = useCreateReminder(taskId);
  const deleteReminder = useDeleteReminder(taskId);

  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState(""); // optional — defaults to 09:00 if left blank

  function addAt(when: Date) {
    createReminder.mutate(when.toISOString(), {
      onSuccess: () => pushToast({ message: "Reminder set" }),
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    const remindAt = new Date(`${date}T${time || "09:00"}:00`).toISOString();
    createReminder.mutate(remindAt, {
      onSuccess: () => {
        setAdding(false);
        setDate("");
        setTime("");
        pushToast({ message: "Reminder set" });
      },
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 text-[13px] font-bold text-text-secondary">
        <span>Reminders</span>
        <span className="font-medium text-text-faint">{reminders?.length ?? 0}</span>
      </div>
      {reminders?.map((r) => (
        <div key={r.id} className="flex items-center gap-[9px] py-1.5 text-[13.5px]">
          <Bell className={cn("h-[15px] w-[15px] shrink-0", r.sentAt ? "text-text-faint" : "text-brand-blue")} />
          <span className={cn("flex-1", r.sentAt && "text-text-faint")}>
            {new Date(r.remindAt).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {r.sentAt && " · sent"}
          </span>
          <button
            onClick={() => deleteReminder.mutate(r.id)}
            className="text-text-faint hover:text-state-danger"
            aria-label="Remove reminder"
          >
            <X className="h-[14px] w-[14px]" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {reminderPresets().map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  addAt(preset.date());
                  setAdding(false);
                }}
                className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              required
              autoFocus
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-brand-blue"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Optional"
              title="Time (optional — defaults to 9:00 AM)"
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text outline-none focus:border-brand-blue"
            />
            <button type="submit" className="rounded-lg bg-brand-flow px-2.5 py-1.5 text-xs font-semibold text-white">
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-text-secondary">
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div
          onClick={() => setAdding(true)}
          className="mt-1 flex cursor-pointer items-center gap-[9px] rounded-[10px] py-1.5 text-[13.5px] font-semibold text-text-secondary hover:text-brand-blue"
        >
          <Plus className="h-[15px] w-[15px]" />
          Add reminder
        </div>
      )}
    </div>
  );
}
