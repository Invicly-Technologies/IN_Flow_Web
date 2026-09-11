import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { createSectionSchema } from "@/features/projects/validations/project.validations";
import { projectService } from "@/features/projects/services/project.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const sections = await projectService.listSections(id, workspaceId);
    return apiSuccess(sections);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;
    const body = createSectionSchema.parse(await request.json());
    const section = await projectService.createSection(id, workspaceId, body.name);
    return apiSuccess(section, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
