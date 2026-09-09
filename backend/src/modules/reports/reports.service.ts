import { prisma } from "../../lib/prisma";
import { computeTenantStatus } from "../../lib/rentStatus";

export interface PropertyReportRow {
  propertyId: string;
  propertyName: string;
  rentExpected: number;
  rentCollected: number;
  rentOutstanding: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  newTenants: number;
}

export interface MonthlyReport {
  period: string;
  properties: PropertyReportRow[];
  totals: Omit<PropertyReportRow, "propertyId" | "propertyName" | "occupancyRate"> & { occupancyRate: number };
}

export async function buildMonthlyReport(propertyIds: string[], period: string): Promise<MonthlyReport> {
  const periodStart = new Date(`${period}-01`);
  const [year, month] = period.split("-").map(Number);
  const periodEnd = month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);

  const rows: PropertyReportRow[] = [];

  for (const propertyId of propertyIds) {
    const [property, units, tenants, payments, expenses, newTenants] = await Promise.all([
      prisma.property.findUnique({ where: { id: propertyId }, select: { name: true } }),
      prisma.unit.count({ where: { propertyId } }),
      prisma.tenant.findMany({ where: { propertyId, active: true }, include: { payments: { where: { period } } } }),
      prisma.payment.findMany({ where: { propertyId, period } }),
      prisma.expense.findMany({ where: { propertyId, expenseDate: { gte: periodStart, lt: periodEnd } } }),
      prisma.tenant.count({ where: { propertyId, createdAt: { gte: periodStart, lt: periodEnd } } }),
    ]);
    if (!property) continue;

    const rentExpected = tenants.reduce((sum, t) => sum + Number(t.rentAmount), 0);
    const rentCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const occupiedUnits = tenants.filter((t) => t.unitId).length;

    rows.push({
      propertyId,
      propertyName: property.name,
      rentExpected,
      rentCollected,
      rentOutstanding: Math.max(rentExpected - rentCollected, 0),
      totalExpenses,
      netIncome: rentCollected - totalExpenses,
      occupancyRate: units > 0 ? Math.round((occupiedUnits / units) * 100) : 0,
      newTenants,
    });
  }

  const totals = rows.reduce(
    (acc, r) => ({
      rentExpected: acc.rentExpected + r.rentExpected,
      rentCollected: acc.rentCollected + r.rentCollected,
      rentOutstanding: acc.rentOutstanding + r.rentOutstanding,
      totalExpenses: acc.totalExpenses + r.totalExpenses,
      netIncome: acc.netIncome + r.netIncome,
      newTenants: acc.newTenants + r.newTenants,
      occupancyRate: 0,
    }),
    { rentExpected: 0, rentCollected: 0, rentOutstanding: 0, totalExpenses: 0, netIncome: 0, newTenants: 0, occupancyRate: 0 }
  );
  totals.occupancyRate = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.occupancyRate, 0) / rows.length) : 0;

  return { period, properties: rows, totals };
}

export function reportToCsv(report: MonthlyReport): string {
  const header = ["Propriété", "Loyers attendus", "Loyers collectés", "Impayés", "Dépenses", "Revenu net", "Occupation %", "Nouveaux locataires"];
  const lines = [header.join(",")];
  for (const r of report.properties) {
    lines.push(
      [r.propertyName, r.rentExpected, r.rentCollected, r.rentOutstanding, r.totalExpenses, r.netIncome, r.occupancyRate, r.newTenants]
        .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
        .join(",")
    );
  }
  lines.push(
    ["TOTAL", report.totals.rentExpected, report.totals.rentCollected, report.totals.rentOutstanding, report.totals.totalExpenses, report.totals.netIncome, report.totals.occupancyRate, report.totals.newTenants].join(",")
  );
  return lines.join("\n");
}

export function reportToHtml(report: MonthlyReport): string {
  const rows = report.properties
    .map(
      (r) =>
        `<tr><td>${r.propertyName}</td><td>${r.rentCollected.toLocaleString("fr-FR")}</td><td>${r.totalExpenses.toLocaleString("fr-FR")}</td><td>${r.netIncome.toLocaleString("fr-FR")}</td><td>${r.occupancyRate}%</td></tr>`
    )
    .join("");
  return `<p>Rapport HaBiTa — ${report.period}</p><table border="1" cellpadding="6" style="border-collapse:collapse"><thead><tr><th>Propriété</th><th>Collecté</th><th>Dépenses</th><th>Net</th><th>Occupation</th></tr></thead><tbody>${rows}</tbody></table><p>Net total : ${report.totals.netIncome.toLocaleString("fr-FR")} FCFA</p>`;
}
