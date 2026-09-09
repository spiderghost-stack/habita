import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { computeTenantStatus, currentPeriod } from "../../lib/rentStatus";
import { createTenantSchema, updateTenantSchema } from "./tenants.schema";

export async function listByProperty(req: Request, res: Response) {
  const propertyId = req.query.propertyId as string | undefined;
  const where = propertyId
    ? { propertyId, active: true }
    : { active: true, property: ownerFilter(req.user!) };

  if (propertyId) await assertPropertyAccess(propertyId, req.user!);

  const tenants = await prisma.tenant.findMany({
    where,
    include: { unit: true, payments: { where: { period: currentPeriod() } } },
    orderBy: { createdAt: "desc" },
  });

  res.json(tenants.map(withComputedStatus));
}

export async function getOne(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: {
      unit: true,
      payments: { orderBy: { period: "desc" } },
    },
  });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const currentPayments = tenant.payments.filter((p) => p.period === currentPeriod());
  res.json({ ...tenant, status: computeTenantStatus(tenant.rentAmount, tenant.dueDay, currentPayments) });
}

export async function create(req: Request, res: Response) {
  const input = createTenantSchema.parse(req.body);
  await assertPropertyAccess(input.propertyId, req.user!);

  if (input.unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: input.unitId } });
    if (!unit || unit.propertyId !== input.propertyId) {
      throw new ApiError(400, "Cette unité n'appartient pas à la propriété indiquée.");
    }
    if (unit.status === "OCCUPIED") {
      throw new ApiError(409, "Cette unité est déjà occupée.");
    }
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email || undefined,
        rentAmount: input.rentAmount,
        dueDay: input.dueDay,
      },
    });

    if (input.unitId) {
      await tx.unit.update({
        where: { id: input.unitId },
        data: { status: "OCCUPIED", occupiedSince: new Date() },
      });
    }

    return created;
  });

  res.status(201).json(tenant);
}

export async function update(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const input = updateTenantSchema.parse(req.body);
  const updated = await prisma.tenant.update({
    where: { id: req.params.id },
    data: { ...input, email: input.email || undefined },
  });
  res.json(updated);
}

// "Départ" du locataire : on ne supprime pas son historique de paiements, on le
// désactive et on libère l'unité — un propriétaire a besoin de retrouver cet
// historique plus tard (litige, bilan de fin d'année, etc.)
export async function moveOut(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({ where: { id: tenant.id }, data: { active: false, unitId: null } });
    if (tenant.unitId) {
      await tx.unit.update({ where: { id: tenant.unitId }, data: { status: "AVAILABLE", occupiedSince: null } });
    }
  });

  res.status(204).send();
}

function withComputedStatus<T extends { rentAmount: any; dueDay: number; payments: Array<{ amount: any }> }>(
  tenant: T
) {
  return { ...tenant, status: computeTenantStatus(tenant.rentAmount, tenant.dueDay, tenant.payments) };
}

// Créer (ou réinitialiser) l'accès à l'espace locataire. Il n'y a pas de
// service d'envoi d'email branché dans ce MVP (voir MANUAL_STEPS.md) : le
// mot de passe temporaire est retourné une seule fois dans la réponse, à
// communiquer au locataire par le propriétaire lui-même (SMS, appel,
// WhatsApp manuel). Ce n'est évidemment pas la solution finale — juste ce
// qui est possible sans compte fournisseur d'email à configurer.
export async function createPortalAccess(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  if (!tenant.email) {
    throw new ApiError(400, "Ce locataire n'a pas d'adresse email enregistrée.");
  }

  const temporaryPassword = crypto.randomBytes(6).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  if (tenant.userId) {
    // Réinitialisation : on garde le même compte, on change juste le mot de passe.
    await prisma.user.update({ where: { id: tenant.userId }, data: { passwordHash } });
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email: tenant.email } });
    if (existingUser) {
      throw new ApiError(409, "Un compte existe déjà avec l'adresse email de ce locataire.");
    }
    const user = await prisma.user.create({
      data: {
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
        passwordHash,
        role: "TENANT",
      },
    });
    await prisma.tenant.update({ where: { id: tenant.id }, data: { userId: user.id } });
  }

  res.status(200).json({ email: tenant.email, temporaryPassword });
}
