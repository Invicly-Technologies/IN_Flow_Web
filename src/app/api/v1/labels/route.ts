import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { createLabelSchema } from "@/features/labels/validations/label.validations";
import { labelService } from "@/features/labels/services/label.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const labels = await labelService.list(workspaceId);
    return apiSuccess(labels);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const body = createLabelSchema.parse(await request.json());
    const label = await labelService.create(workspaceId, body);
    return apiSuccess(label, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
