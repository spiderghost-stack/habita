import { z } from "zod";

export const updateUserSchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "ADMIN", "TENANT"]).optional(),
  plan: z.enum(["FREE", "STARTER", "PRO", "BUSINESS"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
