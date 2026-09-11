import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId, requireProjectInWorkspace } from "@/lib/workspace";
import { parsePagination } from "@/lib/pagination";
import { taskService } from "@/features/tasks/services/task.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    await requireProjectInWorkspace(id, workspaceId);
    const { searchParams } = new URL(request.url);
    const page = parsePagination(searchParams);
    const result = await taskService.list(workspaceId, sub, { projectId: id }, page);
    return apiSuccess(result.data, { meta: result.meta });
  } catch (err) {
    return toErrorResponse(err);
  }
}
