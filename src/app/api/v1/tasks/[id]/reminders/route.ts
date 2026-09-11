import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { createReminderSchema } from "@/features/reminders/validations/reminder.validations";
import { reminderService } from "@/features/reminders/services/reminder.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const reminders = await reminderService.list(id, workspaceId);
    return apiSuccess(reminders);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = createReminderSchema.parse(await request.json());
    const reminder = await reminderService.create(id, workspaceId, body.remindAt);
    return apiSuccess(reminder, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
