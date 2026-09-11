import { prisma } from "@/lib/prisma";
import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";

export const TASK_INCLUDE = {
  labels: { include: { label: true } },
  checklists: { orderBy: { position: "asc" } },
  comments: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, include: { author: true } },
  customFieldValues: { include: { field: true } },
  // Just enough to derive a boolean "has an active reminder" flag without a
  // second round-trip per task — never returns the full reminder list here.
  reminders: { where: { sentAt: null }, select: { id: true }, take: 1 },
  recurrenceRule: true,
  milestone: { select: { id: true, name: true, color: true, dueDate: true } },
  attachments: { orderBy: { createdAt: "desc" }, include: { uploader: true } },
  timeEntries: { orderBy: { loggedAt: "desc" }, include: { user: true } },
  blockedByLinks: { include: { blockerTask: { select: { id: true, title: true, status: true } } } },
  blockingLinks: { include: { blockedTask: { select: { id: true, title: true, status: true } } } },
} satisfies Prisma.TaskInclude;

export interface TaskListFilter {
  workspaceId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  sectionId?: string;
  parentTaskId?: string;
  labelId?: string;
  assigneeId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  q?: string;
  excludeStatus?: TaskStatus[];
  requireDueAt?: boolean;
  requireNoProject?: boolean;
  limit: number;
  offset: number;
}

function buildWhere(filter: TaskListFilter): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    workspaceId: filter.workspaceId,
    deletedAt: null,
  };
  if (filter.status) where.status = filter.status;
  if (filter.excludeStatus?.length) where.status = { notIn: filter.excludeStatus };
  if (filter.priority) where.priority = filter.priority;
  if (filter.projectId) where.projectId = filter.projectId;
  if (filter.requireNoProject) where.projectId = null;
  if (filter.sectionId) where.sectionId = filter.sectionId;
  if (filter.parentTaskId) where.parentTaskId = filter.parentTaskId;
  if (filter.assigneeId) where.assigneeId = filter.assigneeId;
  if (filter.labelId) where.labels = { some: { labelId: filter.labelId } };
  if (filter.requireDueAt) where.dueAt = { not: null };
  if (filter.dueBefore || filter.dueAfter) {
    where.dueAt = {
      ...(typeof where.dueAt === "object" ? where.dueAt : {}),
      ...(filter.dueBefore ? { lte: filter.dueBefore } : {}),
      ...(filter.dueAfter ? { gte: filter.dueAfter } : {}),
    };
  }
  if (filter.q) {
    where.OR = [
      { title: { contains: filter.q, mode: "insensitive" } },
      { description: { contains: filter.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export const taskRepository = {
  async list(filter: TaskListFilter) {
    const where = buildWhere(filter);
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: [{ dueAt: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
        take: filter.limit,
        skip: filter.offset,
      }),
      prisma.task.count({ where }),
    ]);
    return { items, total };
  },

  findById(id: string, workspaceId: string) {
    return prisma.task.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: TASK_INCLUDE,
    });
  },

  countSubtasks(parentTaskId: string) {
    return prisma.task.count({ where: { parentTaskId, deletedAt: null } });
  },

  async create(data: Prisma.TaskUncheckedCreateInput, labelIds: string[] = []) {
    const labels = labelIds.length ? { create: labelIds.map((labelId) => ({ labelId })) } : undefined;

    // Ticket numbers (ENG-1, ENG-2, ...) come from the project's own counter. Incrementing it
    // and creating the task in one transaction means two simultaneous task creations in the
    // same project can never be handed the same number — the second UPDATE blocks on the
    // first's row lock until it commits.
    if (data.projectId) {
      return prisma.$transaction(async (tx) => {
        const project = await tx.project.update({
          where: { id: data.projectId as string },
          data: { taskSequence: { increment: 1 } },
          select: { taskSequence: true },
        });
        return tx.task.create({
          data: { ...data, number: project.taskSequence, labels },
          include: TASK_INCLUDE,
        });
      });
    }

    return prisma.task.create({ data: { ...data, labels }, include: TASK_INCLUDE });
  },

  async update(id: string, data: Prisma.TaskUncheckedUpdateInput, labelIds?: string[]) {
    return prisma.$transaction(async (tx) => {
      if (labelIds) {
        await tx.taskLabel.deleteMany({ where: { taskId: id } });
        if (labelIds.length) {
          await tx.taskLabel.createMany({ data: labelIds.map((labelId) => ({ taskId: id, labelId })) });
        }
      }
      return tx.task.update({
        where: { id },
        data: { ...data, version: { increment: 1 } },
        include: TASK_INCLUDE,
      });
    });
  },

  softDelete(id: string) {
    return prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async addChecklistItem(taskId: string, title: string) {
    const last = await prisma.taskChecklist.findFirst({ where: { taskId }, orderBy: { position: "desc" } });
    return prisma.taskChecklist.create({ data: { taskId, title, position: (last?.position ?? -1) + 1 } });
  },

  findChecklistItem(id: string, taskId: string) {
    return prisma.taskChecklist.findFirst({ where: { id, taskId } });
  },

  updateChecklistItem(id: string, data: Prisma.TaskChecklistUncheckedUpdateInput) {
    return prisma.taskChecklist.update({ where: { id }, data });
  },

  deleteChecklistItem(id: string) {
    return prisma.taskChecklist.delete({ where: { id } });
  },

  addComment(taskId: string, authorId: string, body: string) {
    return prisma.comment.create({ data: { taskId, authorId, body }, include: { author: true } });
  },

  findComment(id: string, taskId: string) {
    return prisma.comment.findFirst({ where: { id, taskId, deletedAt: null } });
  },

  updateComment(id: string, body: string) {
    return prisma.comment.update({ where: { id }, data: { body }, include: { author: true } });
  },

  softDeleteComment(id: string) {
    return prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  upsertRecurrence(
    taskId: string,
    data: { frequency: string; interval: number; byWeekday: number[]; until: Date | null }
  ) {
    return prisma.recurrenceRule.upsert({
      where: { taskId },
      create: { taskId, ...data } as Prisma.RecurrenceRuleUncheckedCreateInput,
      update: data as Prisma.RecurrenceRuleUncheckedUpdateInput,
    });
  },

  deleteRecurrence(taskId: string) {
    return prisma.recurrenceRule.deleteMany({ where: { taskId } });
  },

  /** BFS over "blocks" edges starting from `startTaskId` — used to reject a dependency that would create a cycle. */
  async findsPathTo(startTaskId: string, targetTaskId: string): Promise<boolean> {
    const seen = new Set<string>([startTaskId]);
    let frontier = [startTaskId];
    while (frontier.length) {
      const links = await prisma.taskDependency.findMany({
        where: { blockerTaskId: { in: frontier } },
        select: { blockedTaskId: true },
      });
      const next: string[] = [];
      for (const link of links) {
        if (link.blockedTaskId === targetTaskId) return true;
        if (!seen.has(link.blockedTaskId)) {
          seen.add(link.blockedTaskId);
          next.push(link.blockedTaskId);
        }
      }
      frontier = next;
    }
    return false;
  },

  addDependency(blockerTaskId: string, blockedTaskId: string) {
    return prisma.taskDependency.create({ data: { blockerTaskId, blockedTaskId } });
  },

  findDependency(id: string, blockedTaskId: string) {
    return prisma.taskDependency.findFirst({ where: { id, blockedTaskId } });
  },

  removeDependency(id: string) {
    return prisma.taskDependency.delete({ where: { id } });
  },

  incompleteBlockers(taskId: string) {
    return prisma.taskDependency.findMany({
      where: { blockedTaskId: taskId, blockerTask: { status: { notIn: ["COMPLETED", "CANCELLED"] } } },
      include: { blockerTask: { select: { id: true, title: true } } },
    });
  },

  addTimeEntry(taskId: string, userId: string, minutes: number, note: string | null, loggedAt: Date) {
    return prisma.timeEntry.create({ data: { taskId, userId, minutes, note, loggedAt } });
  },

  findTimeEntry(id: string, taskId: string) {
    return prisma.timeEntry.findFirst({ where: { id, taskId } });
  },

  deleteTimeEntry(id: string) {
    return prisma.timeEntry.delete({ where: { id } });
  },

  addAttachment(input: {
    taskId: string;
    uploaderId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  }) {
    return prisma.attachment.create({ data: input });
  },

  findAttachment(id: string, taskId: string) {
    return prisma.attachment.findFirst({ where: { id, taskId } });
  },

  deleteAttachment(id: string) {
    return prisma.attachment.delete({ where: { id } });
  },

  listActivity(workspaceId: string, taskId: string) {
    return prisma.activityLog.findMany({
      where: { workspaceId, entityType: "Task", entityId: taskId },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { fullName: true } } },
      take: 100,
    });
  },

  async bulkUpdate(ids: string[], workspaceId: string, data: Prisma.TaskUncheckedUpdateManyInput) {
    return prisma.task.updateMany({
      where: { id: { in: ids }, workspaceId, deletedAt: null },
      data,
    });
  },

  async bulkSoftDelete(ids: string[], workspaceId: string) {
    return prisma.task.updateMany({
      where: { id: { in: ids }, workspaceId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },
};
