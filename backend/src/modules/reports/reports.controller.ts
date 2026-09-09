import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { currentPeriod } from "../../lib/rentStatus";
import { sendEmail } from "../../lib/mailer";
import { buildMonthlyReport, reportToCsv, reportToHtml } from "./reports.service";

async function resolvePropertyIds(req: Request): Promise<string[]> {
  const propertyId = req.query.propertyId as string | undefined;
  if (propertyId) {
    const property = await assertPropertyAccess(propertyId, req.user!);
    const owner = await prisma.user.findUnique({ where: { id: property.ownerId } });
    if (!limitsFor(owner!.plan).canUseReports) {
      throw new ApiError(402, `Les rapports nécessitent le plan Pro ou Business (plan actuel : ${owner!.plan}).`);
    }
    return [propertyId];
  }

  const properties = await prisma.property.findMany({ where: ownerFilter(req.user!), select: { id: true } });
  return properties.map((p) => p.id);
}

export async function getReport(req: Request, res: Response) {
  const propertyIds = await resolvePropertyIds(req);
  const period = (req.query.period as string) || currentPeriod();
  const report = await buildMonthlyReport(propertyIds, period);
  res.json(report);
}

export async function downloadCsv(req: Request, res: Response) {
  const propertyIds = await resolvePropertyIds(req);
  const period = (req.query.period as string) || currentPeriod();
  const report = await buildMonthlyReport(propertyIds, period);
  const csv = reportToCsv(report);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="rapport-habita-${period}.csv"`);
  res.send(csv);
}

export async function sendByEmail(req: Request, res: Response) {
  const propertyIds = await resolvePropertyIds(req);
  const period = (req.query.period as string) || currentPeriod();
  const report = await buildMonthlyReport(propertyIds, period);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user?.email) throw new ApiError(400, "Aucune adresse email trouvée sur ce compte.");

  const delivered = await sendEmail({
    to: user.email,
    subject: `Rapport HaBiTa — ${period}`,
    html: reportToHtml(report),
  });

  res.json({ sent: delivered, to: user.email });
}
