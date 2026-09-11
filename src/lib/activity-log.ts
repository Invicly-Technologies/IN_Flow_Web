import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface LogActivityInput {
  workspaceId: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

/** Records an audit-trail row. Awaited (unlike notifications/mail) — this is the record itself, not a side effect. */
export function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
