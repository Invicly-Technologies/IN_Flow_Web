import type { Project, ProjectSection, ProjectStatus } from "@prisma/client";

export interface ProjectSectionDTO {
  id: string;
  name: string;
  position: number;
}

export interface ProjectDTO {
  id: string;
  workspaceId: string;
  name: string;
  key: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  position: number;
  isAdvanced: boolean;
  createdAt: string;
  updatedAt: string;
  sections: ProjectSectionDTO[];
  taskCount: number;
  completedCount: number;
}

type ProjectWithSections = Project & { sections: ProjectSection[] };

export function toProjectDTO(
  project: ProjectWithSections,
  counts: { taskCount: number; completedCount: number } = { taskCount: 0, completedCount: 0 }
): ProjectDTO {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    key: project.key,
    description: project.description,
    icon: project.icon,
    color: project.color,
    status: project.status,
    startDate: project.startDate?.toISOString() ?? null,
    dueDate: project.dueDate?.toISOString() ?? null,
    position: project.position,
    isAdvanced: project.isAdvanced,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    sections: project.sections.map((s) => ({ id: s.id, name: s.name, position: s.position })),
    taskCount: counts.taskCount,
    completedCount: counts.completedCount,
  };
}
