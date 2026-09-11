import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const [userCount, workspaceCount, projectCount, taskCount, newUsersLast7Days] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.workspace.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return apiSuccess({ userCount, workspaceCount, projectCount, taskCount, newUsersLast7Days });
  } catch (err) {
    return toErrorResponse(err);
  }
}
