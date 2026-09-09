import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";
import { Role } from "@prisma/client";

export async function getOrCreateConversation(tenantId: string) {
  let conversation = await prisma.conversation.findUnique({ where: { tenantId } });
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { tenantId } });
  }
  return conversation;
}

export async function listMessages(conversationId: string, readerRole: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });

  // Marquer comme lus les messages envoyés par l'autre partie — un
  // propriétaire qui ouvre la conversation "lit" les messages du locataire,
  // et inversement. On ne touche jamais aux messages qu'on a soi-même envoyés.
  const otherPartyMessageIds = messages
    .filter((m) => m.senderRole !== readerRole && !m.readAt)
    .map((m) => m.id);
  if (otherPartyMessageIds.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: otherPartyMessageIds } },
      data: { readAt: new Date() },
    });
  }

  return messages;
}

export async function createMessage(conversationId: string, senderId: string, senderRole: Role, body: string) {
  if (!body.trim()) throw new ApiError(400, "Le message ne peut pas être vide.");

  const message = await prisma.message.create({
    data: { conversationId, senderId, senderRole, body: body.trim() },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return message;
}
