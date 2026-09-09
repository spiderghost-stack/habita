import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signToken } from "../../lib/jwt";
import { ApiError } from "../../middleware/errorHandler";
import { LoginInput, RegisterInput, UpdateProfileInput } from "./auth.schema";

const SALT_ROUNDS = 10;

export async function registerOwner(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, "Un compte existe déjà avec cette adresse email.");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: "OWNER",
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError(401, "Email ou mot de passe incorrect.");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Email ou mot de passe incorrect.");
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");

  const data: { name?: string; phone?: string; passwordHash?: string } = {};
  if (input.name) data.name = input.name;
  if (input.phone !== undefined) data.phone = input.phone;

  if (input.newPassword) {
    // Le schéma garantit déjà currentPassword présent quand newPassword l'est,
    // mais on revérifie ici : le service ne doit pas faire confiance aveuglément
    // à ce que le contrôleur lui passe.
    const valid = await bcrypt.compare(input.currentPassword ?? "", user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Mot de passe actuel incorrect.");
    }
    data.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });
  return toPublicUser(updated);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");
  return toPublicUser(user);
}

// On ne renvoie jamais le hash du mot de passe au client.
function toPublicUser(user: { id: string; name: string; email: string; role: string; plan: string; phone: string | null; createdAt: Date }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}
