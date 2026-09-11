import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { addProjectMemberSchema } from "@/features/projects/validations/project.validations";
import { projectService } from "@/features/projects/services/project.service";

function toMemberDTO(m: { userId: string; role: string; user: { fullName: string; email: string; avatarUrl: string | null } }) {
  return { userId: m.userId, role: m.role, fullName: m.user.fullName, email: m.user.email, avatarUrl: m.user.avatarUrl };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const members = await projectService.listMembers(id, workspaceId);
    return apiSuccess(members.map(toMemberDTO));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = addProjectMemberSchema.parse(await request.json());
    const members = await projectService.addMember(id, workspaceId, sub, body.userId, body.role);
    return apiSuccess(members.map(toMemberDTO), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
