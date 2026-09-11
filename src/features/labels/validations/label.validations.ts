import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().max(20).optional(),
});
export type CreateLabelInput = z.infer<typeof createLabelSchema>;

export const updateLabelSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: z.string().max(20).nullish(),
});
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
