import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { createMilestoneSchema } from "@/features/projects/validations/project.validations";
import { projectService } from "@/features/projects/services/project.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const milestones = await projectService.listMilestones(id, workspaceId);
    return apiSuccess(milestones);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = createMilestoneSchema.parse(await request.json());
    const milestone = await projectService.createMilestone(id, workspaceId, sub, body);
    return apiSuccess(milestone, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
