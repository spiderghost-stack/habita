import { Decimal } from "@prisma/client/runtime/library";

export type TenantStatus = "UP_TO_DATE" | "DUE_SOON" | "LATE";

export function currentPeriod(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Statut dérivé du loyer en cours, recalculé à la volée plutôt que stocké en base :
 * un statut stocké se périme dès que la date change, ce qui est une source classique
 * de bugs ("pourquoi ce locataire est encore marqué à jour alors qu'on est le 20 ?").
 *
 * Règle simplifiée pour le MVP : on ne regarde que le mois en cours.
 * - payé (somme des paiements du mois >= loyer)         -> UP_TO_DATE
 * - pas encore payé, échéance dans <= 3 jours             -> DUE_SOON
 * - pas encore payé, échéance dépassée                    -> LATE
 * - pas encore payé, échéance dans > 3 jours               -> UP_TO_DATE (rien n'est dû pour l'instant)
 */
export function computeTenantStatus(
  rentAmount: Decimal | number,
  dueDay: number,
  paymentsThisMonth: Array<{ amount: Decimal | number }>,
  now = new Date()
): TenantStatus {
  const rent = Number(rentAmount);
  const paid = paymentsThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

  if (paid >= rent) return "UP_TO_DATE";

  const today = now.getDate();
  const daysUntilDue = dueDay - today;

  if (daysUntilDue < 0) return "LATE";
  if (daysUntilDue <= 3) return "DUE_SOON";
  return "UP_TO_DATE";
}
