import type { NextRequest } from "next/server";
import { apiSuccess, apiError, toErrorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/session";
import { requireWorkspaceId } from "@/lib/workspace";
import { taskService } from "@/features/tasks/services/task.service";
import { saveUploadedFile } from "@/lib/storage";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { sub } = requireAuth(request);
    const workspaceId = await requireWorkspaceId(sub, request.headers.get("x-workspace-id"));
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return apiError("VALIDATION_ERROR", "Expected a multipart/form-data body with a 'file' field");
    }

    const { storageKey, sizeBytes } = await saveUploadedFile(file);
    const task = await taskService.addAttachment(id, workspaceId, sub, {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes,
      storageKey,
    });
    return apiSuccess(task, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("15MB")) {
      return apiError("VALIDATION_ERROR", err.message);
    }
    return toErrorResponse(err);
  }
}
