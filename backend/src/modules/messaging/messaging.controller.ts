import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { getOrCreateConversation, listMessages, createMessage } from "./messaging.service";
import { sendPushNotification } from "../notifications/push.service";

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
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.tenantId },
    include: { property: { include: { managers: true } } },
  });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const conversation = await getOrCreateConversation(tenant.id);
  const message = await createMessage(conversation.id, req.user!.userId, req.user!.role, req.body.body ?? "");

  // Notification Push
  const senderRole = req.user!.role;
  const senderUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  const senderName = senderUser?.name || "HaBiTa";

  if (senderRole === "TENANT") {
    // Si le locataire écrit, on notifie le propriétaire et les gestionnaires
    const ownerId = tenant.property.ownerId;
    const managersIds = tenant.property.managers.map(m => m.managerId);
    const recipients = Array.from(new Set([ownerId, ...managersIds]));

    for (const recipientId of recipients) {
      sendPushNotification(recipientId, {
        title: `Nouveau message de ${tenant.firstName} ${tenant.lastName}`,
        body: message.body,
        url: `/messages`,
      }).catch(console.error);
    }
  } else {
    // Si le propriétaire/gestionnaire écrit, on notifie le locataire
    if (tenant.userId) {
      sendPushNotification(tenant.userId, {
        title: `Nouveau message de ${senderName}`,
        body: message.body,
        url: `/mon-espace/messages`,
      }).catch(console.error);
    }
  }

  res.status(201).json(message);
}
