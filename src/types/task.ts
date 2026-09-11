import type {
  Task,
  TaskChecklist,
  Comment,
  User,
  Label,
  CustomFieldDefinition,
  TaskCustomFieldValue,
  RecurrenceRule,
  Attachment,
  TimeEntry,
  TaskDependency,
} from "@prisma/client";

export interface TaskChecklistDTO {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface TaskCommentDTO {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCustomFieldValueDTO {
  fieldId: string;
  name: string;
  type: CustomFieldDefinition["type"];
  options: string[] | null;
  value: string | number | boolean | null;
}

export interface TaskRecurrenceDTO {
  frequency: RecurrenceRule["frequency"];
  interval: number;
  byWeekday: number[];
  until: string | null;
}

export interface TaskAttachmentDTO {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
}

export interface TaskTimeEntryDTO {
  id: string;
  userId: string;
  userName: string;
  minutes: number;
  note: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface TaskLinkDTO {
  linkId: string;
  taskId: string;
  title: string;
  status: Task["status"];
}

export interface TaskDTO {
  id: string;
  workspaceId: string;
  projectId: string | null;
  sectionId: string | null;
  parentTaskId: string | null;
  milestoneId: string | null;
  milestone: { id: string; name: string; color: string | null; dueDate: string | null } | null;
  number: number | null;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  startAt: string | null;
  dueAt: string | null;
  durationMinutes: number | null;
  position: number;
  createdBy: string;
  completedBy: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  labels: Pick<Label, "id" | "name" | "color">[];
  checklist: TaskChecklistDTO[];
  comments: TaskCommentDTO[];
  customFields: TaskCustomFieldValueDTO[];
  hasActiveReminder: boolean;
  recurrence: TaskRecurrenceDTO | null;
  attachments: TaskAttachmentDTO[];
  timeEntries: TaskTimeEntryDTO[];
  timeSpentMinutes: number;
  blockedBy: TaskLinkDTO[];
  blocking: TaskLinkDTO[];
  isBlocked: boolean;
}

type TaskWithRelations = Task & {
  labels: { label: Label }[];
  checklists: TaskChecklist[];
  comments: (Comment & { author: User })[];
  customFieldValues: (TaskCustomFieldValue & { field: CustomFieldDefinition })[];
  reminders: { id: string }[];
  recurrenceRule: RecurrenceRule | null;
  milestone: { id: string; name: string; color: string | null; dueDate: Date | null } | null;
  attachments: (Attachment & { uploader: User })[];
  timeEntries: (TimeEntry & { user: User })[];
  blockedByLinks: (TaskDependency & { blockerTask: { id: string; title: string; status: Task["status"] } })[];
  blockingLinks: (TaskDependency & { blockedTask: { id: string; title: string; status: Task["status"] } })[];
};

export function toTaskDTO(task: TaskWithRelations): TaskDTO {
  const blockedBy = task.blockedByLinks.map((l) => ({
    linkId: l.id,
    taskId: l.blockerTask.id,
    title: l.blockerTask.title,
    status: l.blockerTask.status,
  }));

  return {
    id: task.id,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    sectionId: task.sectionId,
    parentTaskId: task.parentTaskId,
    milestoneId: task.milestoneId,
    milestone: task.milestone
      ? { id: task.milestone.id, name: task.milestone.name, color: task.milestone.color, dueDate: task.milestone.dueDate?.toISOString() ?? null }
      : null,
    number: task.number,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    startAt: task.startAt?.toISOString() ?? null,
    dueAt: task.dueAt?.toISOString() ?? null,
    durationMinutes: task.durationMinutes,
    position: task.position,
    createdBy: task.createdBy,
    completedBy: task.completedBy,
    completedAt: task.completedAt?.toISOString() ?? null,
    assigneeId: task.assigneeId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    version: task.version,
    labels: task.labels.map((tl) => ({ id: tl.label.id, name: tl.label.name, color: tl.label.color })),
    checklist: task.checklists.map((c) => ({ id: c.id, text: c.title, done: c.isDone, position: c.position })),
    comments: task.comments.map((c) => ({
      id: c.id,
      authorId: c.authorId,
      authorName: c.author.fullName,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    customFields: task.customFieldValues.map((v) => ({
      fieldId: v.fieldId,
      name: v.field.name,
      type: v.field.type,
      options: (v.field.options as string[] | null) ?? null,
      value: v.value as string | number | boolean | null,
    })),
    hasActiveReminder: task.reminders.length > 0,
    recurrence: task.recurrenceRule
      ? {
          frequency: task.recurrenceRule.frequency,
          interval: task.recurrenceRule.interval,
          byWeekday: task.recurrenceRule.byWeekday,
          until: task.recurrenceRule.until?.toISOString() ?? null,
        }
      : null,
    attachments: task.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      url: a.storageKey,
      uploaderId: a.uploaderId,
      uploaderName: a.uploader.fullName,
      createdAt: a.createdAt.toISOString(),
    })),
    timeEntries: task.timeEntries.map((t) => ({
      id: t.id,
      userId: t.userId,
      userName: t.user.fullName,
      minutes: t.minutes,
      note: t.note,
      loggedAt: t.loggedAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    })),
    timeSpentMinutes: task.timeEntries.reduce((sum, t) => sum + t.minutes, 0),
    blockedBy,
    blocking: task.blockingLinks.map((l) => ({
      linkId: l.id,
      taskId: l.blockedTask.id,
      title: l.blockedTask.title,
      status: l.blockedTask.status,
    })),
    isBlocked: blockedBy.some((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED"),
  };
}
