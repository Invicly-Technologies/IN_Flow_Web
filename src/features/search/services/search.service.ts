import { prisma } from "@/lib/prisma";

const RESULT_LIMIT = 8;

export const searchService = {
  async search(workspaceId: string, q: string) {
    const query = q.trim();
    if (!query) {
      return { tasks: [], projects: [], labels: [], people: [], comments: [], files: [] };
    }
    const contains = { contains: query, mode: "insensitive" as const };

    const [tasks, projects, labels, people, comments, files] = await Promise.all([
      prisma.task.findMany({
        where: { workspaceId, deletedAt: null, OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true, status: true, projectId: true },
        take: RESULT_LIMIT,
      }),
      prisma.project.findMany({
        where: { workspaceId, deletedAt: null, name: contains },
        select: { id: true, name: true, color: true, icon: true },
        take: RESULT_LIMIT,
      }),
      prisma.label.findMany({
        where: { workspaceId, deletedAt: null, name: contains },
        select: { id: true, name: true, color: true },
        take: RESULT_LIMIT,
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          workspaceMembers: { some: { workspaceId } },
          OR: [{ fullName: contains }, { email: contains }],
        },
        select: { id: true, fullName: true, email: true, avatarUrl: true },
        take: RESULT_LIMIT,
      }),
      prisma.comment.findMany({
        where: { deletedAt: null, body: contains, task: { workspaceId, deletedAt: null } },
        select: { id: true, body: true, taskId: true },
        take: RESULT_LIMIT,
      }),
      prisma.attachment.findMany({
        where: { fileName: contains, task: { workspaceId, deletedAt: null } },
        select: { id: true, fileName: true, taskId: true },
        take: RESULT_LIMIT,
      }),
    ]);

    return { tasks, projects, labels, people, comments, files };
  },
};
