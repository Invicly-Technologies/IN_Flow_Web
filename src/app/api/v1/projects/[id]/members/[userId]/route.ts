import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { projectService } from "@/features/projects/services/project.service";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, userId } = await params;
    await projectService.removeMember(id, workspaceId, userId);
    return apiSuccess({ removed: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
