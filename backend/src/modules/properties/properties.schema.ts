import { z } from "zod";

export const createPropertySchema = z.object({
  name: z.string().min(2, "Le nom de la propriété est requis."),
  address: z.string().min(2, "L'adresse est requise."),
  description: z.string().optional(),
  potentialIncome: z.number().nonnegative().optional(),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
