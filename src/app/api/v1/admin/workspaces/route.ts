import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const workspaces = await prisma.workspace.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        members: {
          where: { role: "OWNER" },
          take: 1,
          select: { user: { select: { fullName: true, email: true } } },
        },
        _count: { select: { members: true, projects: true, tasks: true } },
      },
    });

    return apiSuccess(
      workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        createdAt: w.createdAt.toISOString(),
        owner: w.members[0]?.user ?? null,
        memberCount: w._count.members,
        projectCount: w._count.projects,
        taskCount: w._count.tasks,
      }))
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
