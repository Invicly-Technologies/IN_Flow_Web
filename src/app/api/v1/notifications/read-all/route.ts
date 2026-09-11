import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { notificationService } from "@/features/notifications/services/notification.service";

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    await notificationService.markAllRead(sub);
    return apiSuccess({ marked: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
