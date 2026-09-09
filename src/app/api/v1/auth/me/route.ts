import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { authService } from "@/features/auth/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const user = await authService.getCurrentUser(sub);
    return apiSuccess(user);
  } catch (err) {
    return toErrorResponse(err);
  }
}
