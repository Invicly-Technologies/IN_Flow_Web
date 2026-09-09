import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requestContext } from "@/lib/session";
import { loginSchema } from "@/validations/auth.validations";
import { authService } from "@/features/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json());
    const result = await authService.login(body, requestContext(request));
    return apiSuccess(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
