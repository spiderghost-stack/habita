import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, assertPropertyOwnerOrAdmin } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { assignManagerSchema } from "./managers.schema";

// Même logique que la création d'accès locataire (voir
// tenants.controller.createPortalAccess) : pas de service d'email branché
// dans ce MVP, donc le mot de passe temporaire d'un nouveau compte
// gestionnaire est retourné une seule fois dans la réponse.
export async function assign(req: Request, res: Response) {
  const property = await assertPropertyAccess(req.params.id, req.user!);
  assertPropertyOwnerOrAdmin(property, req.user!);

  const owner = await prisma.user.findUnique({ where: { id: property.ownerId } });
  if (!limitsFor(owner!.plan).canAssignManagers) {
    throw new ApiError(402, `L'assignation de gestionnaires nécessite le plan Business (plan actuel : ${owner!.plan}).`);
  }

  const input = assignManagerSchema.parse(req.body);

  let manager = await prisma.user.findUnique({ where: { email: input.email } });
  let temporaryPassword: string | undefined;

  if (manager) {
    if (manager.role !== "MANAGER") {
      throw new ApiError(409, "Cette adresse email est déjà utilisée par un compte qui n'est pas un compte gestionnaire.");
    }
  } else {
    temporaryPassword = crypto.randomBytes(6).toString("base64url");
    manager = await prisma.user.create({
      data: {
        name: input.email.split("@")[0],
        email: input.email,
        passwordHash: await bcrypt.hash(temporaryPassword, 10),
        role: "MANAGER",
      },
    });
  }

  const existingAssignment = await prisma.propertyManager.findUnique({
    where: { propertyId_managerId: { propertyId: property.id, managerId: manager.id } },
  });
  if (existingAssignment) {
    throw new ApiError(409, "Ce gestionnaire a déjà accès à cette propriété.");
  }

  await prisma.propertyManager.create({
    data: { propertyId: property.id, managerId: manager.id },
  });

  res.status(201).json({
    manager: { id: manager.id, name: manager.name, email: manager.email },
    temporaryPassword,
  });
}

export async function unassign(req: Request, res: Response) {
  const property = await assertPropertyAccess(req.params.id, req.user!);
  assertPropertyOwnerOrAdmin(property, req.user!);

  await prisma.propertyManager.deleteMany({
    where: { propertyId: property.id, managerId: req.params.managerId },
  });
  res.status(204).send();
}
