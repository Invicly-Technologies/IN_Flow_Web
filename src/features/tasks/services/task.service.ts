import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { taskRepository, type TaskListFilter } from "@/features/tasks/repositories/task.repository";
import { toTaskDTO, type TaskDTO } from "@/types/task";
import type {
  BulkTaskActionInput,
  CreateTaskInput,
  ListTasksQuery,
  RecurrenceInput,
  UpdateTaskInput,
} from "@/features/tasks/validations/task.validations";
import { todayRangeUTC } from "@/lib/date-range";
import { notificationService } from "@/features/notifications/services/notification.service";
import { logActivity } from "@/lib/activity-log";
import { deleteUploadedFile } from "@/lib/storage";

function advanceDate(base: Date, frequency: RecurrenceInput["frequency"], interval: number): Date {
  const next = new Date(base);
  if (frequency === "DAILY") next.setDate(next.getDate() + interval);
  else if (frequency === "WEEKLY") next.setDate(next.getDate() + interval * 7);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + interval);
  else if (frequency === "YEARLY") next.setFullYear(next.getFullYear() + interval);
  else next.setDate(next.getDate() + interval); // CUSTOM falls back to "every N days"
  return next;
}

async function actorName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
  return user?.fullName ?? "Someone";
}

async function assertReferencesInWorkspace(
  workspaceId: string,
  refs: {
    projectId?: string | null;
    sectionId?: string | null;
    parentTaskId?: string | null;
    milestoneId?: string | null;
    assigneeId?: string | null;
    labelIds?: string[];
  }
) {
  if (refs.milestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: refs.milestoneId, project: { workspaceId } },
    });
    if (!milestone) throw new ApiError("VALIDATION_ERROR", "milestoneId does not belong to your workspace");
  }
  if (refs.projectId) {
    const project = await prisma.project.findFirst({ where: { id: refs.projectId, workspaceId, deletedAt: null } });
    if (!project) throw new ApiError("VALIDATION_ERROR", "projectId does not belong to your workspace");
  }
  if (refs.sectionId) {
    const section = await prisma.projectSection.findFirst({
      where: { id: refs.sectionId, deletedAt: null, project: { workspaceId } },
    });
    if (!section) throw new ApiError("VALIDATION_ERROR", "sectionId does not belong to your workspace");
    if (refs.projectId && section.projectId !== refs.projectId) {
      throw new ApiError("VALIDATION_ERROR", "sectionId does not belong to the given projectId");
    }
  }
  if (refs.parentTaskId) {
    const parent = await prisma.task.findFirst({ where: { id: refs.parentTaskId, workspaceId, deletedAt: null } });
    if (!parent) throw new ApiError("VALIDATION_ERROR", "parentTaskId does not belong to your workspace");
  }
  if (refs.assigneeId) {
    const member = await prisma.workspaceMember.findFirst({ where: { userId: refs.assigneeId, workspaceId } });
    if (!member) throw new ApiError("VALIDATION_ERROR", "assigneeId is not a member of your workspace");
  }
  if (refs.labelIds?.length) {
    const count = await prisma.label.count({ where: { id: { in: refs.labelIds }, workspaceId, deletedAt: null } });
    if (count !== refs.labelIds.length) throw new ApiError("VALIDATION_ERROR", "One or more labelIds are invalid");
  }
}

function applyView(filter: TaskListFilter, view: ListTasksQuery["view"], userId: string) {
  if (!view) return;
  const { start, end } = todayRangeUTC();
  switch (view) {
    case "today":
      filter.dueAfter = start;
      filter.dueBefore = end;
      filter.excludeStatus = ["COMPLETED", "CANCELLED"];
      break;
    case "upcoming":
      filter.dueAfter = end;
      filter.excludeStatus = ["COMPLETED", "CANCELLED"];
      break;
    case "overdue":
      filter.dueBefore = start;
      filter.excludeStatus = ["COMPLETED", "CANCELLED"];
      break;
    case "inbox":
      filter.requireNoProject = true;
      filter.excludeStatus = ["COMPLETED", "CANCELLED"];
      break;
    case "important":
      filter.priority = filter.priority ?? "P1";
      filter.excludeStatus = ["COMPLETED", "CANCELLED"];
      break;
    case "assigned_to_me":
      filter.assigneeId = userId;
      break;
  }
}

export const taskService = {
  async list(workspaceId: string, userId: string, query: ListTasksQuery, page: { limit: number; offset: number }) {
    const filter: TaskListFilter = {
      workspaceId,
      status: query.status,
      priority: query.priority,
      projectId: query.projectId,
      sectionId: query.sectionId,
      parentTaskId: query.parentTaskId,
      labelId: query.labelId,
      assigneeId: query.assigneeId,
      dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
      dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
      q: query.q,
      limit: page.limit,
      offset: page.offset,
    };
    applyView(filter, query.view, userId);

    const { items, total } = await taskRepository.list(filter);
    return { data: items.map(toTaskDTO), meta: { total, limit: page.limit, offset: page.offset } };
  },

  async get(id: string, workspaceId: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(id, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    return toTaskDTO(task);
  },

  async create(workspaceId: string, userId: string, input: CreateTaskInput): Promise<TaskDTO> {
    await assertReferencesInWorkspace(workspaceId, input);
    const task = await taskRepository.create(
      {
        workspaceId,
        projectId: input.projectId ?? null,
        sectionId: input.sectionId ?? null,
        parentTaskId: input.parentTaskId ?? null,
        milestoneId: input.milestoneId ?? null,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "P4",
        startAt: input.startAt ? new Date(input.startAt) : null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        durationMinutes: input.durationMinutes ?? null,
        assigneeId: input.assigneeId ?? null,
        createdBy: userId,
      },
      input.labelIds
    );

    if (input.recurrence) {
      await taskRepository.upsertRecurrence(task.id, {
        frequency: input.recurrence.frequency,
        interval: input.recurrence.interval,
        byWeekday: input.recurrence.byWeekday,
        until: input.recurrence.until ? new Date(input.recurrence.until) : null,
      });
    }

    if (input.assigneeId && input.assigneeId !== userId) {
      const name = await actorName(userId);
      await notificationService.notify(
        input.assigneeId,
        "TASK_ASSIGNED",
        `${name} assigned you a task`,
        task.title,
        { taskId: task.id }
      );
    }

    await logActivity({ workspaceId, actorId: userId, entityType: "Task", entityId: task.id, action: "created" });

    return this.get(task.id, workspaceId);
  },

  async update(id: string, workspaceId: string, actorUserId: string, input: UpdateTaskInput): Promise<TaskDTO> {
    const existing = await taskRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Task not found");
    if (existing.version !== input.version) {
      throw new ApiError("CONFLICT", "Task was modified by someone else — reload and try again");
    }
    await assertReferencesInWorkspace(workspaceId, input);

    const nowCompleting = input.status === "COMPLETED" && existing.status !== "COMPLETED";
    if (nowCompleting) await this.assertNotBlocked(id);

    const { version: _version, labelIds, recurrence, ...rest } = input;
    const updated = await taskRepository.update(
      id,
      {
        ...(rest.title !== undefined ? { title: rest.title } : {}),
        ...(rest.description !== undefined ? { description: rest.description } : {}),
        ...(rest.projectId !== undefined ? { projectId: rest.projectId } : {}),
        ...(rest.sectionId !== undefined ? { sectionId: rest.sectionId } : {}),
        ...(rest.parentTaskId !== undefined ? { parentTaskId: rest.parentTaskId } : {}),
        ...(rest.milestoneId !== undefined ? { milestoneId: rest.milestoneId } : {}),
        ...(rest.status !== undefined ? { status: rest.status } : {}),
        ...(nowCompleting ? { completedAt: new Date(), completedBy: actorUserId } : {}),
        ...(rest.status !== undefined && rest.status !== "COMPLETED" && existing.status === "COMPLETED"
          ? { completedAt: null, completedBy: null }
          : {}),
        ...(rest.priority !== undefined ? { priority: rest.priority } : {}),
        ...(rest.startAt !== undefined ? { startAt: rest.startAt ? new Date(rest.startAt) : null } : {}),
        ...(rest.dueAt !== undefined ? { dueAt: rest.dueAt ? new Date(rest.dueAt) : null } : {}),
        ...(rest.durationMinutes !== undefined ? { durationMinutes: rest.durationMinutes } : {}),
        ...(rest.position !== undefined ? { position: rest.position } : {}),
        ...(rest.assigneeId !== undefined ? { assigneeId: rest.assigneeId } : {}),
      },
      labelIds
    );

    if (recurrence !== undefined) {
      if (recurrence === null) {
        await taskRepository.deleteRecurrence(id);
      } else {
        await taskRepository.upsertRecurrence(id, {
          frequency: recurrence.frequency,
          interval: recurrence.interval,
          byWeekday: recurrence.byWeekday,
          until: recurrence.until ? new Date(recurrence.until) : null,
        });
      }
    }

    if (
      rest.assigneeId !== undefined &&
      rest.assigneeId &&
      rest.assigneeId !== existing.assigneeId &&
      rest.assigneeId !== actorUserId
    ) {
      const name = await actorName(actorUserId);
      await notificationService.notify(
        rest.assigneeId,
        "TASK_ASSIGNED",
        `${name} assigned you a task`,
        updated.title,
        { taskId: updated.id }
      );
    }

    if (nowCompleting) await this.onCompleted(updated.id, workspaceId, existing.createdBy, actorUserId, updated.title);

    await logActivity({ workspaceId, actorId: actorUserId, entityType: "Task", entityId: id, action: "updated" });

    return this.get(id, workspaceId);
  },

  async softDelete(id: string, workspaceId: string, actorUserId: string): Promise<void> {
    const existing = await taskRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Task not found");
    await taskRepository.softDelete(id);
    await logActivity({ workspaceId, actorId: actorUserId, entityType: "Task", entityId: id, action: "deleted" });
  },

  /** Shared by complete() and update() (board drag-to-done also completes a task). */
  async assertNotBlocked(taskId: string): Promise<void> {
    const blockers = await taskRepository.incompleteBlockers(taskId);
    if (blockers.length > 0) {
      const names = blockers.map((b) => b.blockerTask.title).join(", ");
      throw new ApiError(
        "VALIDATION_ERROR",
        `This task is blocked by ${blockers.length} incomplete task${blockers.length > 1 ? "s" : ""}: ${names}`
      );
    }
  },

  /** Notifies the creator and, if the task recurs, immediately schedules the next occurrence. */
  async onCompleted(
    taskId: string,
    workspaceId: string,
    creatorId: string,
    completedByUserId: string,
    title: string
  ): Promise<void> {
    if (creatorId !== completedByUserId) {
      const name = await actorName(completedByUserId);
      await notificationService.notify(creatorId, "TASK_COMPLETED", `${name} completed a task`, title, { taskId });
    }

    const full = await taskRepository.findById(taskId, workspaceId);
    if (!full?.recurrenceRule) return;
    const rule = full.recurrenceRule;
    const base = full.dueAt ?? full.startAt ?? new Date();
    const nextDue = advanceDate(base, rule.frequency, rule.interval);
    if (rule.until && nextDue > rule.until) return;

    const next = await taskRepository.create(
      {
        workspaceId,
        projectId: full.projectId,
        sectionId: full.sectionId,
        parentTaskId: null,
        milestoneId: full.milestoneId,
        title: full.title,
        description: full.description,
        priority: full.priority,
        startAt: full.startAt ? advanceDate(full.startAt, rule.frequency, rule.interval) : null,
        dueAt: nextDue,
        durationMinutes: full.durationMinutes,
        assigneeId: full.assigneeId,
        createdBy: full.createdBy,
      },
      full.labels.map((l) => l.labelId)
    );
    await taskRepository.upsertRecurrence(next.id, {
      frequency: rule.frequency,
      interval: rule.interval,
      byWeekday: rule.byWeekday,
      until: rule.until,
    });
  },

  async complete(id: string, workspaceId: string, userId: string): Promise<TaskDTO> {
    const existing = await taskRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Task not found");
    if (existing.status !== "COMPLETED") await this.assertNotBlocked(id);

    const updated = await taskRepository.update(id, {
      status: "COMPLETED",
      completedAt: new Date(),
      completedBy: userId,
    });

    await this.onCompleted(id, workspaceId, existing.createdBy, userId, updated.title);
    await logActivity({ workspaceId, actorId: userId, entityType: "Task", entityId: id, action: "completed" });

    return this.get(id, workspaceId);
  },

  async reopen(id: string, workspaceId: string, actorUserId: string): Promise<TaskDTO> {
    const existing = await taskRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Task not found");
    const updated = await taskRepository.update(id, {
      status: "TODO",
      completedAt: null,
      completedBy: null,
    });
    await logActivity({ workspaceId, actorId: actorUserId, entityType: "Task", entityId: id, action: "reopened" });
    return toTaskDTO(updated);
  },

  async addChecklistItem(taskId: string, workspaceId: string, text: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    await taskRepository.addChecklistItem(taskId, text);
    return this.get(taskId, workspaceId);
  },

  async updateChecklistItem(
    taskId: string,
    itemId: string,
    workspaceId: string,
    input: { text?: string; done?: boolean }
  ): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const item = await taskRepository.findChecklistItem(itemId, taskId);
    if (!item) throw new ApiError("NOT_FOUND", "Checklist item not found");
    await taskRepository.updateChecklistItem(itemId, {
      ...(input.text !== undefined ? { title: input.text } : {}),
      ...(input.done !== undefined ? { isDone: input.done } : {}),
    });
    return this.get(taskId, workspaceId);
  },

  async deleteChecklistItem(taskId: string, itemId: string, workspaceId: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const item = await taskRepository.findChecklistItem(itemId, taskId);
    if (!item) throw new ApiError("NOT_FOUND", "Checklist item not found");
    await taskRepository.deleteChecklistItem(itemId);
    return this.get(taskId, workspaceId);
  },

  async addComment(taskId: string, workspaceId: string, authorId: string, body: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    await taskRepository.addComment(taskId, authorId, body);

    const name = await actorName(authorId);
    const recipients = new Set([task.createdBy, ...(task.assigneeId ? [task.assigneeId] : [])]);
    recipients.delete(authorId);
    await Promise.all(
      [...recipients].map((userId) =>
        notificationService.notify(userId, "TASK_COMMENT", `${name} commented on a task`, task.title, {
          taskId,
        })
      )
    );

    return this.get(taskId, workspaceId);
  },

  async updateComment(
    taskId: string,
    commentId: string,
    workspaceId: string,
    authorId: string,
    body: string
  ): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const comment = await taskRepository.findComment(commentId, taskId);
    if (!comment) throw new ApiError("NOT_FOUND", "Comment not found");
    if (comment.authorId !== authorId) throw new ApiError("FORBIDDEN", "You can only edit your own comments");
    await taskRepository.updateComment(commentId, body);
    return this.get(taskId, workspaceId);
  },

  async deleteComment(taskId: string, commentId: string, workspaceId: string, authorId: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const comment = await taskRepository.findComment(commentId, taskId);
    if (!comment) throw new ApiError("NOT_FOUND", "Comment not found");
    if (comment.authorId !== authorId) throw new ApiError("FORBIDDEN", "You can only delete your own comments");
    await taskRepository.softDeleteComment(commentId);
    return this.get(taskId, workspaceId);
  },

  async addDependency(taskId: string, workspaceId: string, blockerTaskId: string): Promise<TaskDTO> {
    if (taskId === blockerTaskId) throw new ApiError("VALIDATION_ERROR", "A task can't block itself");
    const [task, blocker] = await Promise.all([
      taskRepository.findById(taskId, workspaceId),
      taskRepository.findById(blockerTaskId, workspaceId),
    ]);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    if (!blocker) throw new ApiError("VALIDATION_ERROR", "blockerTaskId does not belong to your workspace");

    const wouldCycle = await taskRepository.findsPathTo(taskId, blockerTaskId);
    if (wouldCycle) {
      throw new ApiError("VALIDATION_ERROR", "That would create a circular dependency");
    }

    try {
      await taskRepository.addDependency(blockerTaskId, taskId);
    } catch {
      throw new ApiError("CONFLICT", "That dependency already exists");
    }
    await logActivity({
      workspaceId,
      actorId: null,
      entityType: "Task",
      entityId: taskId,
      action: "dependency_added",
      metadata: { blockerTaskId },
    });
    return this.get(taskId, workspaceId);
  },

  async removeDependency(taskId: string, workspaceId: string, dependencyId: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const link = await taskRepository.findDependency(dependencyId, taskId);
    if (!link) throw new ApiError("NOT_FOUND", "Dependency not found");
    await taskRepository.removeDependency(dependencyId);
    return this.get(taskId, workspaceId);
  },

  async addTimeEntry(
    taskId: string,
    workspaceId: string,
    userId: string,
    input: { minutes: number; note?: string; loggedAt?: string }
  ): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    await taskRepository.addTimeEntry(
      taskId,
      userId,
      input.minutes,
      input.note ?? null,
      input.loggedAt ? new Date(input.loggedAt) : new Date()
    );
    return this.get(taskId, workspaceId);
  },

  async deleteTimeEntry(taskId: string, entryId: string, workspaceId: string, userId: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const entry = await taskRepository.findTimeEntry(entryId, taskId);
    if (!entry) throw new ApiError("NOT_FOUND", "Time entry not found");
    if (entry.userId !== userId) throw new ApiError("FORBIDDEN", "You can only delete your own time entries");
    await taskRepository.deleteTimeEntry(entryId);
    return this.get(taskId, workspaceId);
  },

  async addAttachment(
    taskId: string,
    workspaceId: string,
    uploaderId: string,
    file: { fileName: string; mimeType: string; sizeBytes: number; storageKey: string }
  ): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    await taskRepository.addAttachment({ taskId, uploaderId, ...file });
    await logActivity({
      workspaceId,
      actorId: uploaderId,
      entityType: "Task",
      entityId: taskId,
      action: "attachment_added",
      metadata: { fileName: file.fileName },
    });
    return this.get(taskId, workspaceId);
  },

  async deleteAttachment(taskId: string, attachmentId: string, workspaceId: string): Promise<TaskDTO> {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const attachment = await taskRepository.findAttachment(attachmentId, taskId);
    if (!attachment) throw new ApiError("NOT_FOUND", "Attachment not found");
    await taskRepository.deleteAttachment(attachmentId);
    await deleteUploadedFile(attachment.storageKey);
    return this.get(taskId, workspaceId);
  },

  async listActivity(taskId: string, workspaceId: string) {
    const task = await taskRepository.findById(taskId, workspaceId);
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");
    const entries = await taskRepository.listActivity(workspaceId, taskId);
    return entries.map((e) => ({
      id: e.id,
      actorName: e.actor?.fullName ?? "System",
      action: e.action,
      metadata: e.metadata as Record<string, unknown> | null,
      createdAt: e.createdAt.toISOString(),
    }));
  },

  async bulkAction(workspaceId: string, actorUserId: string, input: BulkTaskActionInput) {
    if (input.action === "delete") {
      await taskRepository.bulkSoftDelete(input.ids, workspaceId);
    } else if (input.action === "complete") {
      await taskRepository.bulkUpdate(input.ids, workspaceId, {
        status: "COMPLETED",
        completedAt: new Date(),
        completedBy: actorUserId,
      });
    } else if (input.action === "reopen") {
      await taskRepository.bulkUpdate(input.ids, workspaceId, { status: "TODO", completedAt: null, completedBy: null });
    } else if (input.action === "move") {
      if (input.projectId) {
        await assertReferencesInWorkspace(workspaceId, { projectId: input.projectId });
      }
      await taskRepository.bulkUpdate(input.ids, workspaceId, { projectId: input.projectId ?? null, sectionId: null });
    } else if (input.action === "assign") {
      if (input.assigneeId) {
        await assertReferencesInWorkspace(workspaceId, { assigneeId: input.assigneeId });
      }
      await taskRepository.bulkUpdate(input.ids, workspaceId, { assigneeId: input.assigneeId ?? null });
    } else if (input.action === "setPriority") {
      if (!input.priority) throw new ApiError("VALIDATION_ERROR", "priority is required for setPriority");
      await taskRepository.bulkUpdate(input.ids, workspaceId, { priority: input.priority });
    }

    await logActivity({
      workspaceId,
      actorId: actorUserId,
      entityType: "Task",
      entityId: input.ids.join(","),
      action: `bulk_${input.action}`,
      metadata: { count: input.ids.length },
    });

    return { updated: input.ids.length };
  },
};
