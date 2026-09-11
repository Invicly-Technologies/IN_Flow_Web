import type { NextRequest } from "next/server";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { parsePagination } from "@/lib/pagination";
import { createProjectSchema } from "@/features/projects/validations/project.validations";
import { projectService } from "@/features/projects/services/project.service";

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { searchParams } = new URL(request.url);
    const page = parsePagination(searchParams);
    const result = await projectService.list(workspaceId, page);
    return apiSuccess(result.data, { meta: result.meta });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const body = createProjectSchema.parse(await request.json());
    const project = await projectService.create(workspaceId, sub, body);
    return apiSuccess(project, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
