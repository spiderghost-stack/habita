import { z } from "zod";

export const createIssueSchema = z.object({
  category: z.string().min(1, "La catégorie est requise."),
  description: z.string().min(1, "La description est requise."),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  response: z.string().optional(),
  assignedProvider: z.string().optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
