import { z } from "zod";

export const createUnitSchema = z.object({
  propertyId: z.string().min(1),
  identifier: z.string().min(1, "L'identifiant de l'unité est requis (ex: Appartement A)."),
  type: z.string().optional(),
  rentAmount: z.number().positive("Le montant du loyer doit être positif."),
});

export const updateUnitSchema = z.object({
  identifier: z.string().min(1).optional(),
  type: z.string().optional(),
  rentAmount: z.number().positive().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
