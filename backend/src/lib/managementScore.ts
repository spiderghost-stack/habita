import { prisma } from "./prisma";
import { computeTenantStatus, currentPeriod } from "./rentStatus";

/**
 * Score de gestion sur 100, pondéré ainsi (choix arbitraire, à ajuster avec
 * de vrais retours utilisateurs — voir MANUAL_STEPS.md) :
 * - 40% taux de collecte des loyers du mois en cours
 * - 25% taux d'occupation
 * - 15% absence de retards (1 - proportion de locataires en retard)
 * - 10% absence de signalements non résolus
 * - 10% maîtrise des dépenses (dépenses du mois rapportées aux loyers collectés)
 */
export async function computePropertyScore(propertyId: string): Promise<{ score: number; breakdown: Record<string, number> }> {
  const period = currentPeriod();

  const [units, tenants, payments, expenses, unresolvedIssues] = await Promise.all([
    prisma.unit.count({ where: { propertyId } }),
    prisma.tenant.findMany({ where: { propertyId, active: true }, include: { payments: { where: { period } }, unit: true } }),
    prisma.payment.findMany({ where: { propertyId, period } }),
    prisma.expense.findMany({ where: { propertyId, expenseDate: { gte: new Date(`${period}-01`) } } }),
    prisma.issue.count({ where: { propertyId, status: { not: "RESOLVED" } } }),
  ]);

  const rentExpected = tenants.reduce((sum, t) => sum + Number(t.rentAmount), 0);
  const rentCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const occupiedUnits = tenants.filter((t) => t.unitId).length;
  const lateTenants = tenants.filter((t) => computeTenantStatus(t.rentAmount, t.dueDay, t.payments) === "LATE").length;

  const paymentRate = rentExpected > 0 ? Math.min(rentCollected / rentExpected, 1) : 1;
  const occupancyRate = units > 0 ? occupiedUnits / units : 1;
  const lateFreeRate = tenants.length > 0 ? 1 - lateTenants / tenants.length : 1;
  const issueFreeScore = unresolvedIssues === 0 ? 1 : Math.max(1 - unresolvedIssues * 0.25, 0);
  const expenseControlScore = rentCollected > 0 ? Math.max(1 - totalExpenses / rentCollected, 0) : totalExpenses > 0 ? 0 : 1;

  const breakdown = {
    paymentRate: Math.round(paymentRate * 100),
    occupancyRate: Math.round(occupancyRate * 100),
    lateFreeRate: Math.round(lateFreeRate * 100),
    issueFreeScore: Math.round(issueFreeScore * 100),
    expenseControlScore: Math.round(expenseControlScore * 100),
  };

  const score = Math.round(
    paymentRate * 40 + occupancyRate * 25 + lateFreeRate * 15 + issueFreeScore * 10 + expenseControlScore * 10
  );

  return { score: Math.max(0, Math.min(100, score)), breakdown };
}
