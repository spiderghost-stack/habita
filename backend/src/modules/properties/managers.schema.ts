import { z } from "zod";

export const assignManagerSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});

export type AssignManagerInput = z.infer<typeof assignManagerSchema>;
