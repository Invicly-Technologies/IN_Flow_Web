import { z } from "zod";

export const createReminderSchema = z.object({
  remindAt: z.string().datetime(),
});
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
