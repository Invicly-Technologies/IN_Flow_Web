"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar, Flag, Plus, Tag, Bell, Inbox as InboxIcon, Check, User } from "lucide-react";
import type { TaskPriority } from "@prisma/client";
import { AssigneeSelect } from "@/components/tasks/assignee-picker";
import { useAppStore } from "@/features/app/store/app-store";
import { useCreateTask, useDeleteTask } from "@/features/tasks/hooks";
import { useProjects } from "@/features/projects/hooks";
import { useLabels } from "@/features/labels/hooks";
import { apiRequest } from "@/lib/api-client";
import { fmtDate, parseQuickTitle, todayISO, toISODateTime } from "@/features/app/utils/date";
import { priorityColors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ReminderChoice = "none" | "later_today" | "tomorrow" | "next_week";
const REMINDER_OPTIONS: { value: ReminderChoice; label: string }[] = [
  { value: "later_today", label: "Later today, 3pm" },
  { value: "tomorrow", label: "Tomorrow, 9am" },
  { value: "next_week", label: "Next week, 9am" },
];

function reminderDate(choice: ReminderChoice): Date | null {
  const d = new Date();
  if (choice === "later_today") {
    d.setHours(15, 0, 0, 0);
    return d;
  }
  if (choice === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  if (choice === "next_week") {
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  return null;
}

const PRIORITY_ORDER: TaskPriority[] = ["P1", "P2", "P3", "P4"];

export interface ComposerDefaults {
  projectId?: string | null;
  sectionId?: string | null;
  parentTaskId?: string | null;
  dueDate?: string | null;
}

function ChipButton({
  id,
  openId,
  onOpenChange,
  active,
  activeColor,
  icon,
  label,
  children,
}: {
  id: string;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  active?: boolean;
  activeColor?: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Popover.Root open={openId === id} onOpenChange={(next) => onOpenChange(next ? id : null)}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-[5px] rounded-lg border border-border bg-bg px-[9px] py-[5px] text-xs font-semibold text-text-secondary hover:border-brand-blue hover:text-brand-blue",
            active && "border-transparent bg-brand-flow-soft text-brand-blue"
          )}
          style={active && activeColor ? { color: activeColor } : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {icon}
          <span>{label}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[120] min-w-[170px] rounded-[10px] border border-border bg-surface p-1.5 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] px-[9px] py-[7px] text-[13px] font-medium hover:bg-bg"
    >
      {children}
    </div>
  );
}

export function AddTaskTrigger({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-[9px] rounded-[10px] px-[10px] py-[9px] text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-bg hover:text-brand-blue"
    >
      <div className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-text-faint text-text-faint">
        <Plus className="h-2.5 w-2.5" />
      </div>
      <span>Add task</span>
    </div>
  );
}

export function InlineComposer({ defaults = {} }: { defaults?: ComposerDefaults }) {
  const [open, setOpen] = useState(false);

  if (!open) return <AddTaskTrigger onClick={() => setOpen(true)} />;
  return <ComposerForm defaults={defaults} onClose={() => setOpen(false)} />;
}

/**
 * The task quick-add form, shared between the inline (Todoist-style, bordered) composer
 * above and the centered "Add task" dialog (`task-form-dialog.tsx`, unbordered — it relies
 * on the dialog's own chrome instead) — one editing UI instead of two divergent ones.
 */
export function ComposerForm({
  defaults,
  onClose,
  bordered = true,
}: {
  defaults: ComposerDefaults;
  onClose: () => void;
  bordered?: boolean;
}) {
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const pushToast = useAppStore((s) => s.pushToast);
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(defaults.dueDate ?? null);
  const [priority, setPriority] = useState<TaskPriority>("P4");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(defaults.projectId ?? null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [reminder, setReminder] = useState<ReminderChoice>("none");
  const [openChip, setOpenChip] = useState<string | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const isAdvanced = !!project?.isAdvanced;

  function submit() {
    const titleRaw = title.trim();
    if (!titleRaw || createTask.isPending) return;
    const parsed = parseQuickTitle(titleRaw);
    const finalDueDate = dueDate ?? parsed.dueDate ?? null;

    createTask.mutate(
      {
        title: parsed.title,
        description: description.trim() || undefined,
        projectId,
        sectionId: defaults.sectionId ?? null,
        parentTaskId: defaults.parentTaskId ?? null,
        priority,
        dueAt: finalDueDate ? toISODateTime(finalDueDate) : null,
        labelIds,
        ...(isAdvanced ? { assigneeId } : {}),
      },
      {
        onSuccess: (created) => {
          pushToast({
            message: "Task added",
            actionLabel: "Undo",
            onAction: () => deleteTask.mutate(created.id),
          });
          const when = reminderDate(reminder);
          if (when) {
            apiRequest(`/tasks/${created.id}/reminders`, {
              method: "POST",
              body: { remindAt: when.toISOString() },
            }).catch(() => pushToast({ message: "Task added, but reminder couldn't be set" }));
          }
          onClose();
        },
        onError: () => pushToast({ message: "Couldn't add task — please try again" }),
      }
    );
  }

  return (
    <div
      className={cn(
        "px-3 pb-2 pt-2.5",
        bordered && "my-[2px] rounded-xl border-[1.5px] border-brand-blue bg-surface shadow-[0_4px_18px_rgba(49,92,255,.12)]"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder="e.g. Buy groceries tomorrow at 6pm"
        className="w-full border-none bg-transparent pb-1.5 pt-0.5 text-sm font-semibold text-text outline-none placeholder:font-medium placeholder:text-text-faint"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onClose();
        }}
        rows={3}
        placeholder="Description (optional)"
        className="w-full resize-none border-none bg-transparent pb-2 text-[12.5px] text-text-secondary outline-none"
      />

      <div className="mb-2 flex flex-wrap gap-1.5">
        <ChipButton
          id="date"
          openId={openChip}
          onOpenChange={setOpenChip}
          active={!!dueDate}
          icon={<Calendar className="h-[13px] w-[13px]" />}
          label={dueDate ? fmtDate(dueDate) : "Date"}
        >
          {(
            [
              ["Today", todayISO(0)],
              ["Tomorrow", todayISO(1)],
              ["Next week", todayISO(7)],
              ["No date", null],
            ] as [string, string | null][]
          ).map(([label, val]) => (
            <MenuItem key={label} onClick={() => setDueDate(val)}>
              <Calendar className="h-[13px] w-[13px]" />
              {label}
            </MenuItem>
          ))}
          <div className="px-[9px] py-1.5">
            <input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => setDueDate(e.target.value || null)}
              className="w-full rounded-md border border-border bg-surface p-1 text-text"
            />
          </div>
        </ChipButton>

        <ChipButton
          id="priority"
          openId={openChip}
          onOpenChange={setOpenChip}
          active={priority !== "P4"}
          activeColor={priority !== "P4" ? priorityColors[priority] : undefined}
          icon={<Flag className="h-[13px] w-[13px]" />}
          label={priority !== "P4" ? priority : "Priority"}
        >
          {PRIORITY_ORDER.map((p) => (
            <MenuItem key={p} onClick={() => setPriority(p)}>
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: priorityColors[p] }} />
              Priority {p.slice(1)}
            </MenuItem>
          ))}
        </ChipButton>

        <ChipButton
          id="labels"
          openId={openChip}
          onOpenChange={setOpenChip}
          active={labelIds.length > 0}
          icon={<Tag className="h-[13px] w-[13px]" />}
          label={labelIds.length ? `${labelIds.length} label${labelIds.length > 1 ? "s" : ""}` : "Labels"}
        >
          {labels.map((l) => {
            const checked = labelIds.includes(l.id);
            return (
              <MenuItem
                key={l.id}
                onClick={() =>
                  setLabelIds((prev) => (checked ? prev.filter((x) => x !== l.id) : [...prev, l.id]))
                }
              >
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color ?? "#315CFF" }} />
                <span className="flex-1">{l.name}</span>
                {checked && <Check className="h-3 w-3" />}
              </MenuItem>
            );
          })}
        </ChipButton>

        <ChipButton
          id="remind"
          openId={openChip}
          onOpenChange={setOpenChip}
          active={reminder !== "none"}
          icon={<Bell className="h-[13px] w-[13px]" />}
          label={reminder !== "none" ? REMINDER_OPTIONS.find((o) => o.value === reminder)?.label ?? "Remind" : "Remind"}
        >
          {REMINDER_OPTIONS.map((o) => (
            <MenuItem key={o.value} onClick={() => setReminder(o.value)}>
              <Bell className="h-[13px] w-[13px]" />
              {o.label}
            </MenuItem>
          ))}
          {reminder !== "none" && (
            <MenuItem onClick={() => setReminder("none")}>
              <span className="flex-1 text-text-faint">Remove reminder</span>
            </MenuItem>
          )}
        </ChipButton>

        {isAdvanced && (
          <ChipButton
            id="assignee"
            openId={openChip}
            onOpenChange={setOpenChip}
            active={!!assigneeId}
            icon={<User className="h-[13px] w-[13px]" />}
            label="Assignee"
          >
            <div className="min-w-[190px] px-[2px] py-1">
              <AssigneeSelect value={assigneeId} onChange={setAssigneeId} />
            </div>
          </ChipButton>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-1.5">
        <ChipButton
          id="project"
          openId={openChip}
          onOpenChange={setOpenChip}
          icon={
            project ? (
              <span className="h-2 w-2 rounded-sm" style={{ background: project.color ?? "#94A3B8" }} />
            ) : (
              <InboxIcon className="h-3 w-3" />
            )
          }
          label={project ? project.name : "Inbox"}
        >
          <MenuItem onClick={() => setProjectId(null)}>
            <InboxIcon className="h-[13px] w-[13px]" />
            Inbox
          </MenuItem>
          {projects.map((p) => (
            <MenuItem key={p.id} onClick={() => setProjectId(p.id)}>
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: p.color ?? "#94A3B8" }} />
              {p.name}
            </MenuItem>
          ))}
        </ChipButton>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-[12.5px] font-semibold text-text hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={createTask.isPending}
            className="flex items-center gap-1 rounded-[9px] bg-brand-flow px-2.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {createTask.isPending ? "Adding…" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}
