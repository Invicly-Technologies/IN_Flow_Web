import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const taskPrioritySchema = z.enum(["P1", "P2", "P3", "P4"]);

const uuid = z.string().uuid();

export const recurrenceInputSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
  interval: z.number().int().min(1).max(365).default(1),
  byWeekday: z.array(z.number().int().min(0).max(6)).default([]),
  until: z.string().datetime().nullish(),
});
export type RecurrenceInput = z.infer<typeof recurrenceInputSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(20_000).optional(),
  projectId: uuid.nullish(),
  sectionId: uuid.nullish(),
  parentTaskId: uuid.nullish(),
  milestoneId: uuid.nullish(),
  priority: taskPrioritySchema.optional(),
  startAt: z.string().datetime().nullish(),
  dueAt: z.string().datetime().nullish(),
  durationMinutes: z.number().int().positive().nullish(),
  labelIds: z.array(uuid).optional(),
  assigneeId: uuid.nullish(),
  recurrence: recurrenceInputSchema.nullish(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(20_000).nullish(),
  projectId: uuid.nullish(),
  sectionId: uuid.nullish(),
  parentTaskId: uuid.nullish(),
  milestoneId: uuid.nullish(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  startAt: z.string().datetime().nullish(),
  dueAt: z.string().datetime().nullish(),
  durationMinutes: z.number().int().positive().nullish(),
  position: z.number().int().min(0).optional(),
  labelIds: z.array(uuid).optional(),
  assigneeId: uuid.nullish(),
  recurrence: recurrenceInputSchema.nullish(),
  version: z.number().int().min(1),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const addDependencySchema = z.object({
  blockerTaskId: uuid,
});

export const addTimeEntrySchema = z.object({
  minutes: z.number().int().min(1).max(1440),
  note: z.string().trim().max(500).optional(),
  loggedAt: z.string().datetime().optional(),
});

export const bulkTaskActionSchema = z.object({
  ids: z.array(uuid).min(1).max(200),
  action: z.enum(["complete", "reopen", "delete", "move", "assign", "setPriority"]),
  projectId: uuid.nullish(),
  assigneeId: uuid.nullish(),
  priority: taskPrioritySchema.optional(),
});
export type BulkTaskActionInput = z.infer<typeof bulkTaskActionSchema>;

export const createChecklistItemSchema = z.object({
  text: z.string().trim().min(1).max(280),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().trim().min(1).max(280).optional(),
  done: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: uuid.optional(),
  sectionId: uuid.optional(),
  parentTaskId: uuid.optional(),
  labelId: uuid.optional(),
  assigneeId: uuid.optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  view: z.enum(["today", "upcoming", "overdue", "inbox", "important", "assigned_to_me"]).optional(),
  q: z.string().optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
