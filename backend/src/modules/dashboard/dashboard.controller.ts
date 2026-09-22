import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ownerFilter } from "../../lib/ownership";
import { computeTenantStatus, currentPeriod } from "../../lib/rentStatus";

export async function summary(req: Request, res: Response) {
  const propertyWhere = ownerFilter(req.user!);
  const period = currentPeriod();

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true },
  });
  const propertyIds = properties.map((p) => p.id);

  const [unitCount, tenants, paymentsAgg, expensesAgg] = await Promise.all([
    prisma.unit.count({ where: { propertyId: { in: propertyIds } } }),
    prisma.tenant.findMany({
      where: { propertyId: { in: propertyIds }, active: true },
      include: { payments: { where: { period } }, unit: true },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { propertyId: { in: propertyIds }, period },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        propertyId: { in: propertyIds },
        expenseDate: { gte: new Date(`${period}-01`), lt: nextMonth(period) },
      },
    }),
  ]);

  const rentExpected = tenants.reduce((sum, t) => sum + Number(t.rentAmount), 0);
  const rentCollected = Number(paymentsAgg._sum.amount || 0);
  const rentOutstanding = Math.max(rentExpected - rentCollected, 0);
  const totalExpenses = Number(expensesAgg._sum.amount || 0);
  const netIncome = rentCollected - totalExpenses;

  const tenantsWithStatus = tenants.map((t) => ({
    ...t,
    status: computeTenantStatus(t.rentAmount, t.dueDay, t.payments),
  }));
  const lateTenants = tenantsWithStatus.filter((t) => t.status === "LATE");
  const occupiedUnits = tenantsWithStatus.filter((t) => t.unitId).length;

  res.json({
    period,
    properties: properties.length,
    units: unitCount,
    tenants: tenants.length,
    occupancyRate: unitCount > 0 ? Math.round((occupiedUnits / unitCount) * 100) : 0,
    rentExpected,
    rentCollected,
    rentOutstanding,
    totalExpenses,
    netIncome,
    lateCount: lateTenants.length,
    lateTenants: lateTenants.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      phone: t.phone,
      unit: t.unit?.identifier ?? null,
      rentAmount: Number(t.rentAmount),
      dueDay: t.dueDay,
    })),
  });
}

function nextMonth(period: string): Date {
  const [year, month] = period.split("-").map(Number);
  return month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);
}
