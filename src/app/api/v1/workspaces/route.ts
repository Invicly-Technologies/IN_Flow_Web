import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { workspaceRepository } from "@/features/auth/repositories/workspace.repository";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const workspaces = await workspaceRepository.listForUser(sub);
    return apiSuccess(workspaces);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sub } = requireAuth(request);
    const body = createWorkspaceSchema.parse(await request.json());
    const workspace = await workspaceRepository.createWithOwner(body.name, sub);
    return apiSuccess(
      { id: workspace.id, name: workspace.name, slug: workspace.slug, role: "OWNER" as const },
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
