import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { toTaskDTO } from "@/types/task";
import { TASK_INCLUDE } from "@/features/tasks/repositories/task.repository";

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  projectId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { searchParams } = new URL(request.url);
    const { from, to, projectId } = querySchema.parse(Object.fromEntries(searchParams));
    const range = { gte: new Date(from), lte: new Date(to) };

    const [tasks, events] = await Promise.all([
      prisma.task.findMany({
        where: { workspaceId, deletedAt: null, dueAt: range, ...(projectId ? { projectId } : {}) },
        include: TASK_INCLUDE,
        orderBy: { dueAt: "asc" },
      }),
      prisma.calendarEvent.findMany({
        where: { workspaceId, deletedAt: null, startAt: range },
        orderBy: { startAt: "asc" },
      }),
    ]);

    return apiSuccess({
      tasks: tasks.map(toTaskDTO),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
        allDay: e.allDay,
      })),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
