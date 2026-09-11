import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { setTaskCustomFieldValuesSchema } from "@/features/custom-fields/validations/custom-field.validations";
import { customFieldService } from "@/features/custom-fields/services/custom-field.service";
import { taskService } from "@/features/tasks/services/task.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = setTaskCustomFieldValuesSchema.parse(await request.json());
    await customFieldService.setTaskValues(id, workspaceId, body);
    const task = await taskService.get(id, workspaceId);
    return apiSuccess(task);
  } catch (err) {
    return toErrorResponse(err);
  }
}
