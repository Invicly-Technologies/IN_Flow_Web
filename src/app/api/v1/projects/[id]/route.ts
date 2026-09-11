import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId, requireWorkspaceAdmin } from "@/lib/workspace";
import { updateProjectSchema } from "@/features/projects/validations/project.validations";
import { projectService } from "@/features/projects/services/project.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const project = await projectService.get(id, workspaceId);
    return apiSuccess(project);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    await requireWorkspaceAdmin(sub, workspaceId);
    const { id } = await params;
    const body = updateProjectSchema.parse(await request.json());
    const project = await projectService.update(id, workspaceId, body);
    return apiSuccess(project);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    await requireWorkspaceAdmin(sub, workspaceId);
    const { id } = await params;
    await projectService.softDelete(id, workspaceId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
