import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").optional(),
    phone: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères.").optional(),
  })
  .refine((data) => !data.newPassword || !!data.currentPassword, {
    message: "Le mot de passe actuel est requis pour en définir un nouveau.",
    path: ["currentPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
