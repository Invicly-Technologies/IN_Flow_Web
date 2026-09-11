import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { searchService } from "@/features/search/services/search.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const results = await searchService.search(workspaceId, q);
    return apiSuccess(results);
  } catch (err) {
    return toErrorResponse(err);
  }
}
