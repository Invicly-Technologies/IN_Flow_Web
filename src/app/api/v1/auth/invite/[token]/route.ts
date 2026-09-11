import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { workspaceService } from "@/features/auth/services/workspace.service";

interface Params {
  params: Promise<{ token: string }>;
}

/** Public — the register page previews the invite before the user has an account/session. */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const preview = await workspaceService.getInvitePreview(token);
    return apiSuccess(preview);
  } catch (err) {
    return toErrorResponse(err);
  }
}
