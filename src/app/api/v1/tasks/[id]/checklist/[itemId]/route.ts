import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { updateChecklistItemSchema } from "@/features/tasks/validations/task.validations";
import { taskService } from "@/features/tasks/services/task.service";

interface Params {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, itemId } = await params;
    const body = updateChecklistItemSchema.parse(await request.json());
    const task = await taskService.updateChecklistItem(id, itemId, workspaceId, body);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, itemId } = await params;
    const task = await taskService.deleteChecklistItem(id, itemId, workspaceId);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}
