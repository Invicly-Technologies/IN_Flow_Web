import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requestContext } from "@/lib/session";
import { registerSchema } from "@/validations/auth.validations";
import { authService } from "@/features/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());
    const result = await authService.register(body, requestContext(request));
    return apiSuccess(result, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
