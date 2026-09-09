import { z } from "zod";

export const createTenantSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().min(1).optional(),
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  phone: z.string().min(6, "Numéro de téléphone invalide."),
  email: z.string().email().optional().or(z.literal("")),
  rentAmount: z.number().positive("Le montant du loyer doit être positif."),
  dueDay: z.number().int().min(1).max(28).default(5),
});

export const updateTenantSchema = createTenantSchema.partial().omit({ propertyId: true });

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
