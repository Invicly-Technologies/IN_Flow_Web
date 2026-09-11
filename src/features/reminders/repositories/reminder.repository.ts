import { prisma } from "@/lib/prisma";

export const reminderRepository = {
  listByTask(taskId: string) {
    return prisma.reminder.findMany({ where: { taskId }, orderBy: { remindAt: "asc" } });
  },

  create(taskId: string, remindAt: Date) {
    return prisma.reminder.create({ data: { taskId, remindAt } });
  },

  findById(id: string, taskId: string) {
    return prisma.reminder.findFirst({ where: { id, taskId } });
  },

  delete(id: string) {
    return prisma.reminder.delete({ where: { id } });
  },

  findDue(now: Date) {
    return prisma.reminder.findMany({
      where: { sentAt: null, remindAt: { lte: now } },
      include: { task: { select: { id: true, title: true, createdBy: true, assigneeId: true, workspaceId: true } } },
      take: 200,
    });
  },

  markSent(ids: string[]) {
    return prisma.reminder.updateMany({ where: { id: { in: ids } }, data: { sentAt: new Date() } });
  },
};
