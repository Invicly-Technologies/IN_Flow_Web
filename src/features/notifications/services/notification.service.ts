import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import type { NotificationType, Prisma } from "@prisma/client";

function toDTO(n: {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Prisma.JsonValue;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationService = {
  /** Fire-and-forget: never let a notification failure break the mutation that triggered it. */
  async notify(userId: string, type: NotificationType, title: string, body?: string, data?: object) {
    try {
      await prisma.notification.create({ data: { userId, type, title, body, data } });
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  },

  async list(userId: string, page: { limit: number; offset: number }) {
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: page.limit,
        skip: page.offset,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { data: items.map(toDTO), meta: { total, ...page, unread } };
  },

  async markRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new ApiError("NOT_FOUND", "Notification not found");
    const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    return toDTO(updated);
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  },
};
