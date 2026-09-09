import { z } from "zod";

export const createPaymentSchema = z.object({
  tenantId: z.string().min(1),
  amount: z.number().positive("Le montant doit être positif."),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Format de période attendu : YYYY-MM."),
  paymentDate: z.string().datetime().optional(),
  method: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHECK", "OTHER"]).default("CASH"),
  comment: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
