import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";

const FEDAPAY_API_URL = process.env.FEDAPAY_ENVIRONMENT === "live" 
  ? "https://api.fedapay.com/v1" 
  : "https://sandbox-api.fedapay.com/v1";

const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;

const PLANS_PRICING: Record<string, { price: number; name: string }> = {
  STARTER: { price: 1500, name: "Plan Starter" },
  PRO: { price: 3000, name: "Plan Pro" },
  BUSINESS: { price: 5000, name: "Plan Business" },
};

export async function createSubscription(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(401, "Non autorisé");

  const { plan } = req.body;
  if (!plan || !PLANS_PRICING[plan as string]) {
    throw new ApiError(400, "Plan invalide");
  }

  const selectedPlan = PLANS_PRICING[plan as string];

  if (!FEDAPAY_SECRET_KEY) {
    throw new ApiError(500, "Configuration de paiement manquante");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "Utilisateur introuvable");

  // 1. Créer la transaction sur FedaPay
  const txResponse = await fetch(`${FEDAPAY_API_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      description: `Abonnement ${selectedPlan.name} HaBiTa`,
      amount: selectedPlan.price,
      currency: { iso: "XOF" },
      callback_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      customer: {
        firstname: user.name.split(" ")[0] || "Client",
        lastname: user.name.split(" ").slice(1).join(" ") || "HaBiTa",
        email: user.email,
        phone_number: user.phone ? { number: user.phone, country: "BJ" } : undefined,
      },
      // On sauvegarde l'ID de l'utilisateur et le plan choisi dans les metadata de la transaction
      custom_metadata: {
        userId: user.id,
        plan: plan,
      },
    }),
  });

  if (!txResponse.ok) {
    const errorData = await txResponse.text();
    console.error("Erreur FedaPay Transaction:", errorData);
    throw new ApiError(500, "Erreur lors de l'initialisation du paiement");
  }

  const txData: any = await txResponse.json();
  const transactionId = txData.v1_transaction.id;

  // 2. Générer le lien de paiement (token)
  const tokenResponse = await fetch(`${FEDAPAY_API_URL}/transactions/${transactionId}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
    },
  });

  if (!tokenResponse.ok) {
    console.error("Erreur FedaPay Token:", await tokenResponse.text());
    throw new ApiError(500, "Erreur lors de la génération du lien de paiement");
  }

  const tokenData: any = await tokenResponse.json();
  const paymentUrl = tokenData.token.url;

  res.status(200).json({ url: paymentUrl });
}

export async function webhook(req: Request, res: Response) {
  // FedaPay envoie les événements webhook ici
  const event = req.body;

  console.log("FedaPay Webhook reçu:", event.entity);

  if (event.name === "transaction.approved") {
    const transaction = event.entity;
    const metadata = transaction.custom_metadata;

    if (metadata && metadata.userId && metadata.plan) {
      console.log(`Paiement approuvé pour l'utilisateur ${metadata.userId}. Passage au plan ${metadata.plan}`);
      
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { plan: metadata.plan },
      });
    }
  }

  // Toujours répondre 200 OK à FedaPay
  res.status(200).send("OK");
}
