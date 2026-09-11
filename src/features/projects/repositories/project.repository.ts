import { prisma } from "@/lib/prisma";
import type { Prisma, ProjectRole } from "@prisma/client";

const PROJECT_INCLUDE = { sections: { orderBy: { position: "asc" } } } satisfies Prisma.ProjectInclude;

export const projectRepository = {
  list(workspaceId: string, limit: number, offset: number) {
    return Promise.all([
      prisma.project.findMany({
        where: { workspaceId, deletedAt: null },
        include: PROJECT_INCLUDE,
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.project.count({ where: { workspaceId, deletedAt: null } }),
    ]);
  },

  findById(id: string, workspaceId: string) {
    return prisma.project.findFirst({ where: { id, workspaceId, deletedAt: null }, include: PROJECT_INCLUDE });
  },

  findByKey(workspaceId: string, key: string) {
    return prisma.project.findFirst({ where: { workspaceId, key, deletedAt: null }, select: { id: true } });
  },

  create(data: Prisma.ProjectUncheckedCreateInput) {
    return prisma.project.create({ data, include: PROJECT_INCLUDE });
  },

  update(id: string, data: Prisma.ProjectUncheckedUpdateInput) {
    return prisma.project.update({ where: { id }, data, include: PROJECT_INCLUDE });
  },

  softDelete(id: string) {
    return prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  taskCounts(projectId: string) {
    return prisma.task.groupBy({
      by: ["status"],
      where: { projectId, deletedAt: null },
      _count: true,
    });
  },

  listSections(projectId: string) {
    return prisma.projectSection.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { position: "asc" },
    });
  },

  async createSection(projectId: string, name: string) {
    const last = await prisma.projectSection.findFirst({
      where: { projectId, deletedAt: null },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    return prisma.projectSection.create({
      data: { projectId, name, position: (last?.position ?? -1) + 1 },
    });
  },

  addMember(projectId: string, userId: string, role: ProjectRole) {
    return prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role },
      update: {},
    });
  },

  listMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
  },

  removeMember(projectId: string, userId: string) {
    return prisma.projectMember.deleteMany({ where: { projectId, userId } });
  },

  updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    return prisma.projectMember.update({ where: { projectId_userId: { projectId, userId } }, data: { role } });
  },

  listMilestones(projectId: string) {
    return prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { tasks: true } } },
    });
  },

  findMilestone(id: string, projectId: string) {
    return prisma.milestone.findFirst({ where: { id, projectId } });
  },

  findMilestoneInWorkspace(id: string, workspaceId: string) {
    return prisma.milestone.findFirst({ where: { id, project: { workspaceId, deletedAt: null } } });
  },

  createMilestone(projectId: string, data: { name: string; color?: string | null; dueDate?: Date | null }) {
    return prisma.milestone.create({ data: { projectId, ...data } });
  },

  updateMilestone(id: string, data: Prisma.MilestoneUncheckedUpdateInput) {
    return prisma.milestone.update({ where: { id }, data });
  },

  deleteMilestone(id: string) {
    return prisma.milestone.delete({ where: { id } });
  },

  listAttachments(projectId: string, workspaceId: string) {
    return prisma.attachment.findMany({
      where: { task: { projectId, workspaceId, deletedAt: null } },
      include: { uploader: true, task: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
