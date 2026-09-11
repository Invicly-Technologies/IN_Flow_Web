import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { customFieldRepository } from "@/features/custom-fields/repositories/custom-field.repository";
import type {
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  SetTaskCustomFieldValuesInput,
} from "@/features/custom-fields/validations/custom-field.validations";
import type { CustomFieldDefinition } from "@prisma/client";

function toDTO(field: CustomFieldDefinition) {
  return {
    id: field.id,
    name: field.name,
    type: field.type,
    options: (field.options as string[] | null) ?? null,
    position: field.position,
  };
}

export const customFieldService = {
  async list(workspaceId: string) {
    const fields = await customFieldRepository.list(workspaceId);
    return fields.map(toDTO);
  },

  async create(workspaceId: string, input: CreateCustomFieldInput) {
    const existing = await customFieldRepository.findByName(workspaceId, input.name);
    if (existing) throw new ApiError("CONFLICT", "A custom field with this name already exists");
    if (input.type === "SELECT" && (!input.options || input.options.length === 0)) {
      throw new ApiError("VALIDATION_ERROR", "SELECT fields require at least one option");
    }
    const field = await customFieldRepository.create({
      workspaceId,
      name: input.name,
      type: input.type,
      options: input.type === "SELECT" ? input.options : undefined,
    });
    return toDTO(field);
  },

  async update(id: string, workspaceId: string, input: UpdateCustomFieldInput) {
    const existing = await customFieldRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Custom field not found");
    const updated = await customFieldRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.options !== undefined ? { options: input.options } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    });
    return toDTO(updated);
  },

  async softDelete(id: string, workspaceId: string) {
    const existing = await customFieldRepository.findById(id, workspaceId);
    if (!existing) throw new ApiError("NOT_FOUND", "Custom field not found");
    await customFieldRepository.softDelete(id);
  },

  async setTaskValues(taskId: string, workspaceId: string, input: SetTaskCustomFieldValuesInput) {
    const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId, deletedAt: null } });
    if (!task) throw new ApiError("NOT_FOUND", "Task not found");

    const fieldIds = input.values.map((v) => v.fieldId);
    const validFields = await prisma.customFieldDefinition.findMany({
      where: { id: { in: fieldIds }, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (validFields.length !== new Set(fieldIds).size) {
      throw new ApiError("VALIDATION_ERROR", "One or more custom fields are invalid for this workspace");
    }

    await Promise.all(input.values.map((v) => customFieldRepository.upsertValue(taskId, v.fieldId, v.value)));
  },
};
