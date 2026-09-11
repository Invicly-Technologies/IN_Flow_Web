import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { taskService } from "@/features/tasks/services/task.service";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, entryId } = await params;
    const task = await taskService.deleteTimeEntry(id, entryId, workspaceId, sub);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}
