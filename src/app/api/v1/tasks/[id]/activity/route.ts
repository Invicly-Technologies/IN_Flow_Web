import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { taskService } from "@/features/tasks/services/task.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const entries = await taskService.listActivity(id, workspaceId);
    return apiSuccess(entries);
  } catch (err) {
    return toErrorResponse(err);
  }
}
