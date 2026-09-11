import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { updateTaskSchema } from "@/features/tasks/validations/task.validations";
import { taskService } from "@/features/tasks/services/task.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const task = await taskService.get(id, workspaceId);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = updateTaskSchema.parse(await request.json());
    const task = await taskService.update(id, workspaceId, sub, body);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    await taskService.softDelete(id, workspaceId, sub);
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
