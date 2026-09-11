import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { createCustomFieldSchema } from "@/features/custom-fields/validations/custom-field.validations";
import { customFieldService } from "@/features/custom-fields/services/custom-field.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const fields = await customFieldService.list(workspaceId);
    return apiSuccess(fields);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const body = createCustomFieldSchema.parse(await request.json());
    const field = await customFieldService.create(workspaceId, body);
    return apiSuccess(field, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
