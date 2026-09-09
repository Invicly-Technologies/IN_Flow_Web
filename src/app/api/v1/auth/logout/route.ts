import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { logoutSchema } from "@/validations/auth.validations";
import { authService } from "@/features/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = logoutSchema.parse(await request.json());
    await authService.logout(body.refreshToken);
    return apiSuccess({ loggedOut: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
