import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { updateCommentSchema } from "@/features/tasks/validations/task.validations";
import { taskService } from "@/features/tasks/services/task.service";

interface Params {
  params: Promise<{ id: string; commentId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, commentId } = await params;
    const body = updateCommentSchema.parse(await request.json());
    const task = await taskService.updateComment(id, commentId, workspaceId, sub, body.body);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, commentId } = await params;
    const task = await taskService.deleteComment(id, commentId, workspaceId, sub);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}
