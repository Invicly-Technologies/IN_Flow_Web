import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { bulkTaskActionSchema } from "@/features/tasks/validations/task.validations";
import { taskService } from "@/features/tasks/services/task.service";

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const body = bulkTaskActionSchema.parse(await request.json());
    const result = await taskService.bulkAction(workspaceId, sub, body);
    return apiSuccess(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
