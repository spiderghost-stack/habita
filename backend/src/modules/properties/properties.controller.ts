import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, assertPropertyOwnerOrAdmin, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { createPropertySchema, updatePropertySchema } from "./properties.schema";

export async function list(req: Request, res: Response) {
  const properties = await prisma.property.findMany({
    where: ownerFilter(req.user!),
    include: {
      _count: { select: { units: true, tenants: true } },
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(properties);
}

export async function getOne(req: Request, res: Response) {
  await assertPropertyAccess(req.params.id, req.user!);
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: {
      units: { orderBy: { createdAt: "asc" } },
      tenants: { where: { active: true } },
      managers: { include: { manager: { select: { id: true, name: true, email: true } } } },
      owner: { select: { name: true } },
    },
  });
  res.json(property);
}

export async function create(req: Request, res: Response) {
  // Un gestionnaire ne crée pas ses propres propriétés — il gère celles qui
  // lui sont assignées par leur propriétaire (voir POST /properties/:id/managers).
  if (req.user!.role === "MANAGER") {
    throw new ApiError(403, "Un compte gestionnaire ne peut pas créer de propriété.");
  }

  if (req.user!.role !== "ADMIN") {
    const owner = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const limits = limitsFor(owner!.plan);
    const currentCount = await prisma.property.count({ where: { ownerId: req.user!.userId } });
    if (currentCount >= limits.maxProperties) {
      throw new ApiError(
        402,
        `Votre plan (${owner!.plan}) est limité à ${limits.maxProperties} propriété(s). Passez à un plan supérieur pour en ajouter davantage.`
      );
    }
  }

  const input = createPropertySchema.parse(req.body);
  const property = await prisma.property.create({
    data: { ...input, ownerId: req.user!.userId },
  });
  res.status(201).json(property);
}

export async function update(req: Request, res: Response) {
  const property = await assertPropertyAccess(req.params.id, req.user!);
  assertPropertyOwnerOrAdmin(property, req.user!);

  const input = updatePropertySchema.parse(req.body);
  const updated = await prisma.property.update({
    where: { id: req.params.id },
    data: input,
  });
  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const property = await assertPropertyAccess(req.params.id, req.user!);
  assertPropertyOwnerOrAdmin(property, req.user!);

  await prisma.property.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
