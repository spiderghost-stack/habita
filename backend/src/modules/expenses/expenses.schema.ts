import { z } from "zod";

export const createExpenseSchema = z.object({
  propertyId: z.string().min(1),
  label: z.string().min(1, "Le libellé de la dépense est requis."),
  amount: z.number().positive("Le montant doit être positif."),
  category: z.string().optional(),
  expenseDate: z.string().datetime().optional(),
  comment: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({ propertyId: true });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
