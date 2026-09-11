import { z } from "zod";

export const customFieldTypeSchema = z.enum(["TEXT", "NUMBER", "DATE", "CHECKBOX", "SELECT"]);

export const createCustomFieldSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: customFieldTypeSchema,
  options: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
});
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;

export const updateCustomFieldSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  options: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  position: z.number().int().min(0).optional(),
});
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;

const fieldValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const setTaskCustomFieldValuesSchema = z.object({
  values: z.array(z.object({ fieldId: z.string().uuid(), value: fieldValueSchema })).max(100),
});
export type SetTaskCustomFieldValuesInput = z.infer<typeof setTaskCustomFieldValuesSchema>;
