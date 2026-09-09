import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";
import { computeTenantStatus, currentPeriod } from "../../lib/rentStatus";
import { createIssueSchema } from "../issues/issues.schema";
import { sendEmail } from "../../lib/mailer";
import { getOrCreateConversation, listMessages, createMessage } from "../messaging/messaging.service";

// Toutes les routes de ce module supposent req.user.role === "TENANT"
// (imposé par requireRole dans tenant-portal.routes.ts). On retrouve la
// fiche locataire à partir du compte connecté plutôt qu'un paramètre d'URL :
// un locataire ne doit jamais pouvoir consulter un autre logement que le
// sien en changeant un identifiant dans l'adresse.
async function getOwnTenant(userId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { userId },
    include: { unit: true, property: true, payments: { orderBy: { period: "desc" } } },
  });
  if (!tenant) {
    throw new ApiError(404, "Aucune fiche locataire n'est associée à ce compte.");
  }
  return tenant;
}

export async function me(req: Request, res: Response) {
  const tenant = await getOwnTenant(req.user!.userId);
  const currentPayments = tenant.payments.filter((p) => p.period === currentPeriod());

  res.json({
    id: tenant.id,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    rentAmount: tenant.rentAmount,
    dueDay: tenant.dueDay,
    status: computeTenantStatus(tenant.rentAmount, tenant.dueDay, currentPayments),
    property: { name: tenant.property.name, address: tenant.property.address },
    unit: tenant.unit ? { identifier: tenant.unit.identifier, type: tenant.unit.type } : null,
  });
}

export async function payments(req: Request, res: Response) {
  const tenant = await getOwnTenant(req.user!.userId);
  res.json(tenant.payments);
}

export async function listIssues(req: Request, res: Response) {
  const tenant = await getOwnTenant(req.user!.userId);
  const issues = await prisma.issue.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(issues);
}

export async function createIssue(req: Request, res: Response) {
  const tenant = await getOwnTenant(req.user!.userId);
  const input = createIssueSchema.parse(req.body);

  const issue = await prisma.issue.create({
    data: {
      propertyId: tenant.propertyId,
      tenantId: tenant.id,
      category: input.category,
      description: input.description,
      photoUrl: input.photoUrl || undefined,
    },
  });

  // Le cahier des charges prévoit que le propriétaire soit notifié dès
  // qu'un signalement arrive (section 15). On ne bloque pas la réponse au
  // locataire si l'email échoue — le signalement est déjà enregistré et
  // visible depuis l'interface propriétaire de toute façon.
  const owner = await prisma.user.findUnique({ where: { id: tenant.property.ownerId } });
  if (owner?.email) {
    sendEmail({
      to: owner.email,
      subject: `Nouveau signalement — ${tenant.property.name}`,
      html: `<p>${tenant.firstName} ${tenant.lastName} (${tenant.property.name}) a signalé un problème :</p><p><strong>${input.category}</strong></p><p>${input.description}</p>`,
    }).catch(() => undefined);
  }

  res.status(201).json(issue);
}

export async function getMessages(req: Request, res: Response) {
  const tenant = await getOwnTenant(req.user!.userId);
  const conversation = await getOrCreateConversation(tenant.id);
  const messages = await listMessages(conversation.id, req.user!.role);
  res.json(messages);
}

export async function sendMessage(req: Request, res: Response) {
  const tenant = await getOwnTenant(req.user!.userId);
  const conversation = await getOrCreateConversation(tenant.id);
  const message = await createMessage(conversation.id, req.user!.userId, req.user!.role, req.body.body ?? "");
  res.status(201).json(message);
}
