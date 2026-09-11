import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { updateMilestoneSchema } from "@/features/projects/validations/project.validations";
import { projectService } from "@/features/projects/services/project.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = updateMilestoneSchema.parse(await request.json());
    const milestone = await projectService.updateMilestone(id, workspaceId, body);
    return apiSuccess(milestone);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    await projectService.deleteMilestone(id, workspaceId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
