import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { createContractSchema, updateContractSchema } from "./contracts.schema";

export async function list(req: Request, res: Response) {
  const propertyId = req.query.propertyId as string | undefined;
  if (propertyId) await assertPropertyAccess(propertyId, req.user!);

  const where = propertyId ? { propertyId } : { property: ownerFilter(req.user!) };

  const contracts = await prisma.contract.findMany({
    where,
    include: { tenant: true, property: { select: { name: true } } },
    orderBy: { endDate: "asc" },
  });

  res.json(contracts.map(withExpiryFlag));
}

export async function create(req: Request, res: Response) {
  const input = createContractSchema.parse(req.body);

  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  const property = await assertPropertyAccess(tenant.propertyId, req.user!);

  const owner = await prisma.user.findUnique({ where: { id: property.ownerId } });
  if (!limitsFor(owner!.plan).canUseContracts) {
    throw new ApiError(402, `La gestion des contrats nécessite le plan Pro ou Business (plan actuel : ${owner!.plan}).`);
  }

  if (new Date(input.endDate) <= new Date(input.startDate)) {
    throw new ApiError(400, "La date de fin doit être postérieure à la date de début.");
  }

  const contract = await prisma.contract.create({
    data: {
      propertyId: tenant.propertyId,
      tenantId: tenant.id,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      rentAmount: input.rentAmount,
      deposit: input.deposit,
      conditions: input.conditions,
      documentsNote: input.documentsNote,
      recordedById: req.user!.userId,
    },
  });

  res.status(201).json(contract);
}

export async function update(req: Request, res: Response) {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) throw new ApiError(404, "Contrat introuvable.");
  await assertPropertyAccess(contract.propertyId, req.user!);

  const input = updateContractSchema.parse(req.body);
  const updated = await prisma.contract.update({
    where: { id: req.params.id },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });
  res.json(updated);
}

// "Renouveler" : on prolonge la date de fin plutôt que de créer un nouveau
// contrat — plus simple à suivre pour le propriétaire qu'un historique de
// contrats successifs pour un même locataire, et suffisant pour ce MVP.
export async function renew(req: Request, res: Response) {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) throw new ApiError(404, "Contrat introuvable.");
  await assertPropertyAccess(contract.propertyId, req.user!);

  const { newEndDate } = req.body as { newEndDate?: string };
  if (!newEndDate || new Date(newEndDate) <= contract.endDate) {
    throw new ApiError(400, "La nouvelle date de fin doit être postérieure à l'échéance actuelle.");
  }

  const updated = await prisma.contract.update({
    where: { id: req.params.id },
    data: { endDate: new Date(newEndDate), status: "ACTIVE" },
  });
  res.json(updated);
}

export async function terminate(req: Request, res: Response) {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) throw new ApiError(404, "Contrat introuvable.");
  await assertPropertyAccess(contract.propertyId, req.user!);

  const updated = await prisma.contract.update({
    where: { id: req.params.id },
    data: { status: "TERMINATED" },
  });
  res.json(updated);
}

function withExpiryFlag<T extends { endDate: Date; status: string }>(contract: T) {
  const daysUntilExpiry = Math.ceil((contract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const expiringSoon = contract.status === "ACTIVE" && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  return { ...contract, daysUntilExpiry, expiringSoon };
}
