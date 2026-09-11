import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { updateLabelSchema } from "@/features/labels/validations/label.validations";
import { labelService } from "@/features/labels/services/label.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = updateLabelSchema.parse(await request.json());
    const label = await labelService.update(id, workspaceId, body);
    return apiSuccess(label);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    await labelService.softDelete(id, workspaceId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
