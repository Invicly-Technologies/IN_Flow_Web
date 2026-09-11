import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";

/**
 * Every workspace-scoped query goes through here first. A user's workspace
 * membership is the only source of truth for which workspaceId they may
 * touch — never trust a workspaceId supplied by the client in isolation.
 *
 * The client may request a specific workspace (the "current" one from the
 * workspace switcher) via the X-Workspace-Id header; it is only honored once
 * membership is verified, and falls back to the user's first/only workspace
 * when absent.
 */
export async function requireWorkspaceId(userId: string, requestedWorkspaceId?: string | null): Promise<string> {
  if (requestedWorkspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: requestedWorkspaceId },
      select: { workspaceId: true },
    });
    if (!membership) {
      throw new ApiError("FORBIDDEN", "You are not a member of that workspace");
    }
    return membership.workspaceId;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (!membership) {
    throw new ApiError("FORBIDDEN", "You do not belong to any workspace");
  }
  return membership.workspaceId;
}

export function requestedWorkspaceId(request: Request): string | null {
  return request.headers.get("x-workspace-id");
}

/**
 * Gates admin-only actions (project settings edits/deletion, etc.) to workspace OWNER/ADMIN
 * or a super-admin. Mirrors the client-side check in the UI (which hides the Settings tab for
 * everyone else) — this is the enforcement that actually matters, since the UI gate alone
 * can't stop a direct API call.
 */
export async function requireWorkspaceAdmin(userId: string, workspaceId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSuperAdmin: true } });
  if (user?.isSuperAdmin) return;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new ApiError("FORBIDDEN", "Only workspace admins can do this");
  }
}

export async function requireProjectInWorkspace(projectId: string, workspaceId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId, deletedAt: null },
  });
  if (!project) {
    throw new ApiError("NOT_FOUND", "Project not found in your workspace");
  }
  return project;
}
