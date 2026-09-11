import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { workspaceService } from "@/features/auth/services/workspace.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const invites = await workspaceService.listPendingInvites(workspaceId);
    return apiSuccess(invites);
  } catch (err) {
    return toErrorResponse(err);
  }
}
