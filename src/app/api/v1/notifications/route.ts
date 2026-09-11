import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { parsePagination } from "@/lib/pagination";
import { notificationService } from "@/features/notifications/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const page = parsePagination(searchParams);
    const result = await notificationService.list(sub, page);
    return apiSuccess(result.data, { meta: result.meta });
  } catch (err) {
    return toErrorResponse(err);
  }
}
