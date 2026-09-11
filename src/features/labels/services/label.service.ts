import { ApiError } from "@/lib/api-response";
import { labelRepository } from "@/features/labels/repositories/label.repository";
import type { CreateLabelInput, UpdateLabelInput } from "@/features/labels/validations/label.validations";

export const labelService = {
  list(workspaceId: string) {
    return labelRepository.list(workspaceId);
  },

  async create(workspaceId: string, input: CreateLabelInput) {
    const existing = await labelRepository.findByName(workspaceId, input.name);
    if (existing) throw new ApiError("CONFLICT", "A label with this name already exists");
    return labelRepository.create({ workspaceId, name: input.name, color: input.color ?? "#315CFF" });
  },

  async update(id: string, workspaceId: string, input: UpdateLabelInput) {
    const existing = await labelRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Label not found");
    return labelRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    });
  },

  async softDelete(id: string, workspaceId: string) {
    const existing = await labelRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Label not found");
    await labelRepository.softDelete(id);
  },
};
