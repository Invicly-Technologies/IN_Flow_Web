import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { updateProfileSchema } from "@/validations/auth.validations";
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

export async function PATCH(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const body = updateProfileSchema.parse(await request.json());
    const user = await authService.updateProfile(sub, body);
    return apiSuccess(user);
  } catch (err) {
    return toErrorResponse(err);
  }
}
