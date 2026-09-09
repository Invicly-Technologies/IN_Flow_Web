import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { refreshSchema } from "@/validations/auth.validations";
import { authService } from "@/features/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = refreshSchema.parse(await request.json());
    const result = await authService.refresh(body.refreshToken);
    return apiSuccess(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
