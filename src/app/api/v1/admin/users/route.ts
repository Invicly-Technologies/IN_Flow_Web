import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        isSuperAdmin: true,
        createdAt: true,
        _count: { select: { workspaceMembers: true, createdTasks: true } },
      },
    });

    return apiSuccess(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        isSuperAdmin: u.isSuperAdmin,
        createdAt: u.createdAt.toISOString(),
        workspaceCount: u._count.workspaceMembers,
        taskCount: u._count.createdTasks,
      }))
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
