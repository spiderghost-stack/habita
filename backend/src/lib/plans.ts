// Correspond au tableau de la section 21 du cahier des charges. Il n'y a
// pas de prestataire de paiement récurrent branché dans ce MVP (voir
// MANUAL_STEPS.md) : le plan d'un compte est modifié à la main par un
// administrateur (page /admin), jamais par un vrai paiement. Ce module ne
// fait donc que la partie "limites appliquées", pas la partie "facturation".

export type PlanName = "FREE" | "STARTER" | "PRO" | "BUSINESS";

interface PlanLimits {
  maxProperties: number; // Infinity = illimité
  maxUnits: number;
  canUseContracts: boolean;
  canUseExpenses: boolean;
  canUseReports: boolean;
  canUseManagementScore: boolean;
  canAssignManagers: boolean;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  FREE: {
    maxProperties: 1,
    maxUnits: 2,
    canUseContracts: false,
    canUseExpenses: false,
    canUseReports: false,
    canUseManagementScore: false,
    canAssignManagers: false,
  },
  STARTER: {
    maxProperties: Infinity,
    maxUnits: 10,
    canUseContracts: false,
    canUseExpenses: false,
    canUseReports: false,
    canUseManagementScore: false,
    canAssignManagers: false,
  },
  PRO: {
    maxProperties: Infinity,
    maxUnits: 50,
    canUseContracts: true,
    canUseExpenses: true,
    canUseReports: true,
    canUseManagementScore: true,
    canAssignManagers: false,
  },
  BUSINESS: {
    maxProperties: Infinity,
    maxUnits: Infinity,
    canUseContracts: true,
    canUseExpenses: true,
    canUseReports: true,
    canUseManagementScore: true,
    canAssignManagers: true,
  },
};

export function limitsFor(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.FREE;
}
