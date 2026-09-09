import { z } from "zod";

export const createContractSchema = z.object({
  tenantId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  rentAmount: z.number().positive("Le montant du loyer doit être positif."),
  deposit: z.number().nonnegative().optional(),
  conditions: z.string().optional(),
  documentsNote: z.string().optional(),
});

export const updateContractSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  rentAmount: z.number().positive().optional(),
  deposit: z.number().nonnegative().optional(),
  conditions: z.string().optional(),
  documentsNote: z.string().optional(),
  status: z.enum(["ACTIVE", "TERMINATED", "EXPIRED"]).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
