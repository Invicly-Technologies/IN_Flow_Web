import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { reminderRepository } from "@/features/reminders/repositories/reminder.repository";
import { notificationService } from "@/features/notifications/services/notification.service";

async function requireTaskInWorkspace(taskId: string, workspaceId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId, deletedAt: null } });
  if (!task) throw new ApiError("NOT_FOUND", "Task not found");
  return task;
}

function toDTO(reminder: { id: string; taskId: string; remindAt: Date; sentAt: Date | null; createdAt: Date }) {
  return {
    id: reminder.id,
    taskId: reminder.taskId,
    remindAt: reminder.remindAt.toISOString(),
    sentAt: reminder.sentAt?.toISOString() ?? null,
    createdAt: reminder.createdAt.toISOString(),
  };
}

export const reminderService = {
  async list(taskId: string, workspaceId: string) {
    await requireTaskInWorkspace(taskId, workspaceId);
    const reminders = await reminderRepository.listByTask(taskId);
    return reminders.map(toDTO);
  },

  async create(taskId: string, workspaceId: string, remindAt: string) {
    await requireTaskInWorkspace(taskId, workspaceId);
    const reminder = await reminderRepository.create(taskId, new Date(remindAt));
    return toDTO(reminder);
  },

  async remove(taskId: string, reminderId: string, workspaceId: string) {
    await requireTaskInWorkspace(taskId, workspaceId);
    const reminder = await reminderRepository.findById(reminderId, taskId);
    if (!reminder) throw new ApiError("NOT_FOUND", "Reminder not found");
    await reminderRepository.delete(reminderId);
  },

  /**
   * Meant to be hit periodically by an external scheduler (cron-job.org, GitHub
   * Actions schedule, Vercel Cron, etc.) — there's no long-running process here
   * to fire reminders on its own. Turns each due, unsent reminder into a
   * notification for the task's assignee (or its creator if unassigned).
   */
  async dispatchDue(): Promise<{ dispatched: number }> {
    const due = await reminderRepository.findDue(new Date());
    if (due.length === 0) return { dispatched: 0 };

    await Promise.all(
      due.map((r) =>
        notificationService.notify(
          r.task.assigneeId ?? r.task.createdBy,
          "TASK_DUE_SOON",
          "Reminder",
          r.task.title,
          { taskId: r.task.id }
        )
      )
    );
    await reminderRepository.markSent(due.map((r) => r.id));
    return { dispatched: due.length };
  },
};
