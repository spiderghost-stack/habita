import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { computePropertyScore } from "../../lib/managementScore";

export async function getScore(req: Request, res: Response) {
  const property = await assertPropertyAccess(req.params.propertyId, req.user!);

  const owner = await prisma.user.findUnique({ where: { id: property.ownerId } });
  if (!limitsFor(owner!.plan).canUseManagementScore) {
    throw new ApiError(402, `Le score de gestion nécessite le plan Pro ou Business (plan actuel : ${owner!.plan}).`);
  }

  const result = await computePropertyScore(property.id);
  res.json(result);
}
