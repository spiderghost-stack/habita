import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { createUnitSchema, updateUnitSchema } from "./units.schema";

export async function create(req: Request, res: Response) {
  const input = createUnitSchema.parse(req.body);
  const property = await assertPropertyAccess(input.propertyId, req.user!);

  const owner = await prisma.user.findUnique({ where: { id: property.ownerId } });
  const limits = limitsFor(owner!.plan);
  const currentUnitCount = await prisma.unit.count({ where: { property: { ownerId: property.ownerId } } });
  if (currentUnitCount >= limits.maxUnits) {
    throw new ApiError(
      402,
      `Le plan du propriétaire (${owner!.plan}) est limité à ${limits.maxUnits} unité(s) au total. Passez à un plan supérieur pour en ajouter davantage.`
    );
  }

  const unit = await prisma.unit.create({ data: input });
  res.status(201).json(unit);
}

export async function update(req: Request, res: Response) {
  const unit = await prisma.unit.findUnique({ where: { id: req.params.id } });
  if (!unit) throw new ApiError(404, "Unité introuvable.");
  await assertPropertyAccess(unit.propertyId, req.user!);

  const input = updateUnitSchema.parse(req.body);

  // On ne laisse pas repasser une unité occupée à "disponible" à la main : ce
  // statut se dérive du fait qu'un locataire actif lui soit rattaché ou non.
  if (input.status === "AVAILABLE" && unit.status === "OCCUPIED") {
    const activeTenant = await prisma.tenant.findFirst({ where: { unitId: unit.id, active: true } });
    if (activeTenant) {
      throw new ApiError(409, "Impossible : un locataire actif est encore rattaché à cette unité.");
    }
  }

  const updated = await prisma.unit.update({ where: { id: req.params.id }, data: input });
  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const unit = await prisma.unit.findUnique({ where: { id: req.params.id } });
  if (!unit) throw new ApiError(404, "Unité introuvable.");
  await assertPropertyAccess(unit.propertyId, req.user!);

  await prisma.unit.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
