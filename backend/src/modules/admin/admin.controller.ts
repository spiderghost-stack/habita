import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";
import { updateUserSchema } from "./admin.schema";

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
      _count: { select: { properties: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
}

export async function updateUser(req: Request, res: Response) {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new ApiError(404, "Utilisateur introuvable.");

  // On ne laisse pas un admin se retirer lui-même son propre rôle admin par
  // erreur de clic — ça pourrait verrouiller l'accès à cette page si c'est
  // le seul compte admin existant.
  if (target.id === req.user!.userId && req.body.role && req.body.role !== "ADMIN") {
    throw new ApiError(400, "Vous ne pouvez pas retirer votre propre rôle administrateur depuis cette page.");
  }

  const input = updateUserSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: input,
    select: { id: true, name: true, email: true, role: true, plan: true },
  });
  res.json(updated);
}
