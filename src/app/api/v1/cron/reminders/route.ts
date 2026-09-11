import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { reminderService } from "@/features/reminders/services/reminder.service";

/**
 * Not user-authenticated — meant to be hit by an external scheduler, so it's
 * guarded by a shared secret instead (CRON_SECRET), passed as ?token=... or
 * an `Authorization: Bearer <token>` header.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return apiError("INTERNAL_ERROR", "CRON_SECRET is not configured");
  }
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get("token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return apiError("UNAUTHORIZED", "Invalid or missing cron token");
  }

  const result = await reminderService.dispatchDue();
  return apiSuccess(result);
}
