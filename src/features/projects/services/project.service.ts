import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { projectRepository } from "@/features/projects/repositories/project.repository";
import { toProjectDTO, type ProjectDTO } from "@/types/project";
import type {
  CreateMilestoneInput,
  CreateProjectInput,
  UpdateMilestoneInput,
  UpdateProjectInput,
} from "@/features/projects/validations/project.validations";
import type { ProjectRole } from "@prisma/client";
import { notificationService } from "@/features/notifications/services/notification.service";
import { logActivity } from "@/lib/activity-log";

export interface MilestoneDTO {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  dueDate: string | null;
  achievedAt: string | null;
  taskCount: number;
}

function toMilestoneDTO(m: {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  dueDate: Date | null;
  achievedAt: Date | null;
  _count?: { tasks: number };
}): MilestoneDTO {
  return {
    id: m.id,
    projectId: m.projectId,
    name: m.name,
    color: m.color,
    dueDate: m.dueDate?.toISOString() ?? null,
    achievedAt: m.achievedAt?.toISOString() ?? null,
    taskCount: m._count?.tasks ?? 0,
  };
}

async function withCounts(project: Awaited<ReturnType<typeof projectRepository.findById>>) {
  if (!project) return null;
  const grouped = await projectRepository.taskCounts(project.id);
  const taskCount = grouped.reduce((sum, g) => sum + g._count, 0);
  const completedCount = grouped.find((g) => g.status === "COMPLETED")?._count ?? 0;
  return toProjectDTO(project, { taskCount, completedCount });
}

export const projectService = {
  async list(workspaceId: string, page: { limit: number; offset: number }) {
    const [items, total] = await projectRepository.list(workspaceId, page.limit, page.offset);
    const withCountsList = await Promise.all(items.map((p) => withCounts(p)));
    return { data: withCountsList as ProjectDTO[], meta: { total, ...page } };
  },

  async get(id: string, workspaceId: string): Promise<ProjectDTO> {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    return (await withCounts(project))!;
  },

  async create(workspaceId: string, userId: string, input: CreateProjectInput): Promise<ProjectDTO> {
    if (input.key) {
      const clash = await projectRepository.findByKey(workspaceId, input.key);
      if (clash) throw new ApiError("VALIDATION_ERROR", `Project key "${input.key}" is already in use`);
    }
    const project = await projectRepository.create({
      workspaceId,
      name: input.name,
      key: input.key ?? null,
      description: input.description ?? null,
      icon: input.icon ?? input.name.slice(0, 1).toUpperCase(),
      color: input.color ?? "#6D3DF5",
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    });
    // Every project gets a default section so the List view has somewhere to put tasks.
    await projectRepository.createSection(project.id, "General");
    // The creator is automatically a member, so the Members tab is never empty for their own projects.
    await projectRepository.addMember(project.id, userId, "ADMIN");
    const refreshed = await projectRepository.findById(project.id, workspaceId);
    return (await withCounts(refreshed))!;
  },

  async update(id: string, workspaceId: string, input: UpdateProjectInput): Promise<ProjectDTO> {
    const existing = await projectRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Project not found");
    const updated = await projectRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate ? new Date(input.startDate) : null } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.isAdvanced !== undefined ? { isAdvanced: input.isAdvanced } : {}),
    });
    return (await withCounts(updated))!;
  },

  async softDelete(id: string, workspaceId: string): Promise<void> {
    const existing = await projectRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Project not found");
    await projectRepository.softDelete(id);
  },

  async listSections(id: string, workspaceId: string) {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    return projectRepository.listSections(id);
  },

  async createSection(id: string, workspaceId: string, name: string) {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    return projectRepository.createSection(id, name);
  },

  async listMembers(id: string, workspaceId: string) {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    return projectRepository.listMembers(id);
  },

  async addMember(id: string, workspaceId: string, actorUserId: string, targetUserId: string, role: ProjectRole) {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    const isWorkspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: targetUserId, workspaceId },
    });
    if (!isWorkspaceMember) {
      throw new ApiError("VALIDATION_ERROR", "That person isn't a member of this workspace yet");
    }
    await projectRepository.addMember(id, targetUserId, role);
    if (targetUserId !== actorUserId) {
      const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { fullName: true } });
      await notificationService.notify(
        targetUserId,
        "SYSTEM",
        `${actor?.fullName ?? "Someone"} added you to a project`,
        project.name,
        { projectId: id }
      );
    }
    return projectRepository.listMembers(id);
  },

  async removeMember(id: string, workspaceId: string, targetUserId: string) {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    await projectRepository.removeMember(id, targetUserId);
  },

  async listMilestones(id: string, workspaceId: string): Promise<MilestoneDTO[]> {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    const milestones = await projectRepository.listMilestones(id);
    return milestones.map(toMilestoneDTO);
  },

  async createMilestone(id: string, workspaceId: string, actorUserId: string, input: CreateMilestoneInput): Promise<MilestoneDTO> {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    const milestone = await projectRepository.createMilestone(id, {
      name: input.name,
      color: input.color ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    });
    await logActivity({
      workspaceId,
      actorId: actorUserId,
      entityType: "Project",
      entityId: id,
      action: "milestone_created",
      metadata: { milestoneId: milestone.id, name: milestone.name },
    });
    return toMilestoneDTO({ ...milestone, _count: { tasks: 0 } });
  },

  async updateMilestone(milestoneId: string, workspaceId: string, input: UpdateMilestoneInput): Promise<MilestoneDTO> {
    const milestone = await projectRepository.findMilestoneInWorkspace(milestoneId, workspaceId);
    if (!milestone) throw new ApiError("NOT_FOUND", "Milestone not found");
    const updated = await projectRepository.updateMilestone(milestoneId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      ...(input.achieved !== undefined ? { achievedAt: input.achieved ? new Date() : null } : {}),
    });
    const withCount = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { _count: { select: { tasks: true } } },
    });
    return toMilestoneDTO(withCount ?? updated);
  },

  async deleteMilestone(milestoneId: string, workspaceId: string): Promise<void> {
    const milestone = await projectRepository.findMilestoneInWorkspace(milestoneId, workspaceId);
    if (!milestone) throw new ApiError("NOT_FOUND", "Milestone not found");
    await projectRepository.deleteMilestone(milestoneId);
  },

  async listAttachments(id: string, workspaceId: string) {
    const project = await projectRepository.findById(id, workspaceId);
    if (!project) throw new ApiError("NOT_FOUND", "Project not found");
    const attachments = await projectRepository.listAttachments(id, workspaceId);
    return attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      url: a.storageKey,
      uploaderName: a.uploader.fullName,
      createdAt: a.createdAt.toISOString(),
      taskId: a.task!.id,
      taskTitle: a.task!.title,
    }));
  },
};
