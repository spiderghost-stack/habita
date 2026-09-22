import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { createSubscription, webhook } from "./billing.controller";

const router = Router();

// Route pour initialiser un paiement FedaPay (nécessite d'être connecté)
router.post("/subscribe", requireAuth, createSubscription);

// Webhook appelé par FedaPay (ne nécessite pas d'authentification)
router.post("/webhook", webhook);

export { router as billingRoutes };
