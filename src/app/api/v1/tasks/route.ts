import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { parsePagination } from "@/lib/pagination";
import { createTaskSchema, listTasksQuerySchema } from "@/features/tasks/validations/task.validations";
import { taskService } from "@/features/tasks/services/task.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { searchParams } = new URL(request.url);
    const query = listTasksQuerySchema.parse(Object.fromEntries(searchParams));
    const page = parsePagination(searchParams);
    const result = await taskService.list(workspaceId, sub, query, page);
    return apiSuccess(result.data, { meta: result.meta });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const body = createTaskSchema.parse(await request.json());
    const task = await taskService.create(workspaceId, sub, body);
    return apiSuccess(task, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
