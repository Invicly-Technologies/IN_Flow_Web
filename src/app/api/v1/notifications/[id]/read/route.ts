import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { notificationService } from "@/features/notifications/services/notification.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const { id } = await params;
    const notification = await notificationService.markRead(id, sub);
    return apiSuccess(notification);
  } catch (err) {
    return toErrorResponse(err);
  }
}
