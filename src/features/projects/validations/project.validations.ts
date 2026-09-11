import { z } from "zod";

export const projectStatusSchema = z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);

// Jira-style ticket prefix (e.g. "ENG"): uppercase letters/digits, must start with a letter.
export const projectKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{1,9}$/, "2-10 characters, letters and numbers, starting with a letter");

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  key: projectKeySchema.optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  startDate: z.string().datetime().nullish(),
  dueDate: z.string().datetime().nullish(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  icon: z.string().max(10).nullish(),
  color: z.string().max(20).nullish(),
  status: projectStatusSchema.optional(),
  startDate: z.string().datetime().nullish(),
  dueDate: z.string().datetime().nullish(),
  position: z.number().int().min(0).optional(),
  isAdvanced: z.boolean().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createSectionSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const projectRoleSchema = z.enum(["ADMIN", "EDITOR", "VIEWER"]);

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: projectRoleSchema.default("EDITOR"),
});
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

export const createMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(200),
  color: z.string().max(20).nullish(),
  dueDate: z.string().datetime().nullish(),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  color: z.string().max(20).nullish(),
  dueDate: z.string().datetime().nullish(),
  achieved: z.boolean().optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
