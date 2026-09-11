import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { workspaceService } from "@/features/auth/services/workspace.service";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const members = await workspaceService.listMembers(workspaceId);
    return apiSuccess(members);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const body = inviteSchema.parse(await request.json());
    const result = await workspaceService.inviteByEmail(workspaceId, sub, body.email, body.role);
    return apiSuccess(result, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
