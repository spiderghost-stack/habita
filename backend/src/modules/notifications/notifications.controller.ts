import { Request, Response } from "express";
import { ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { runNotifications } from "./notifications.service";

// Déclenchement par un propriétaire ou gestionnaire connecté, limité à ses
// propres propriétés — utile pour tester sans attendre le job planifié, ou
// pour renvoyer les rappels du jour après une correction de dernière minute.
export async function runForCurrentUser(req: Request, res: Response) {
  const summary = await runNotifications(ownerFilter(req.user!));
  res.json(summary);
}

// Déclenchement par un service externe (cron Render, cron-job.org, etc.) sur
// l'ensemble de la plateforme — voir DEPLOY_RENDER.md pour la configuration.
// Pas de JWT ici : un cron externe n'a pas de session utilisateur, donc
// l'authentification passe par un secret partagé dans l'en-tête.
export async function runGlobal(req: Request, res: Response) {
  const secret = req.header("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    throw new ApiError(401, "Secret de déclenchement invalide ou manquant.");
  }

  const summary = await runNotifications({});
  res.json(summary);
}
