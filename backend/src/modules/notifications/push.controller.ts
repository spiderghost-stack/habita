import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function subscribe(req: Request, res: Response) {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Abonnement push invalide." });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: req.user!.userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId: req.user!.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  res.json({ success: true });
}

export async function unsubscribe(req: Request, res: Response) {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint manquant." });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: req.user!.userId },
  });

  res.json({ success: true });
}
