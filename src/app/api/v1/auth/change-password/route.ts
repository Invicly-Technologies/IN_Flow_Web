import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { changePasswordSchema } from "@/validations/auth.validations";
import { authService } from "@/features/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const body = changePasswordSchema.parse(await request.json());
    await authService.changePassword(sub, body);
    return apiSuccess({ changed: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
