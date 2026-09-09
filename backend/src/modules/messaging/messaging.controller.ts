import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { getOrCreateConversation, listMessages, createMessage } from "./messaging.service";

export async function listConversations(req: Request, res: Response) {
  const tenants = await prisma.tenant.findMany({
    where: { active: true, property: ownerFilter(req.user!) },
    include: {
      property: { select: { name: true } },
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { messages: { where: { readAt: null, senderRole: "TENANT" } } } },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  res.json(
    tenants
      .filter((t) => t.conversation) // seuls les locataires ayant déjà échangé au moins un message apparaissent
      .map((t) => ({
        tenantId: t.id,
        tenantName: `${t.firstName} ${t.lastName}`,
        propertyName: t.property.name,
        lastMessage: t.conversation!.messages[0]?.body ?? null,
        lastMessageAt: t.conversation!.messages[0]?.createdAt ?? null,
        unreadCount: t.conversation!._count.messages,
      }))
  );
}

export async function getMessages(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const conversation = await getOrCreateConversation(tenant.id);
  const messages = await listMessages(conversation.id, req.user!.role);
  res.json(messages);
}

export async function sendMessage(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const conversation = await getOrCreateConversation(tenant.id);
  const message = await createMessage(conversation.id, req.user!.userId, req.user!.role, req.body.body ?? "");
  res.status(201).json(message);
}
