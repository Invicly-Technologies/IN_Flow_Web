import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { workspaceService } from "@/features/auth/services/workspace.service";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { userId } = await params;
    await workspaceService.removeMember(workspaceId, userId);
    return apiSuccess({ removed: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
