import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { reminderService } from "@/features/reminders/services/reminder.service";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; reminderId: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id, reminderId } = await params;
    await reminderService.remove(id, reminderId, workspaceId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
