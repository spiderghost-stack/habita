import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { updateIssueSchema } from "./issues.schema";

export async function list(req: Request, res: Response) {
  const propertyId = req.query.propertyId as string | undefined;
  if (propertyId) await assertPropertyAccess(propertyId, req.user!);

  const where = propertyId ? { propertyId } : { property: ownerFilter(req.user!) };

  const issues = await prisma.issue.findMany({
    where,
    include: { tenant: true, property: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  res.json(issues);
}

export async function update(req: Request, res: Response) {
  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw new ApiError(404, "Signalement introuvable.");
  await assertPropertyAccess(issue.propertyId, req.user!);

  const input = updateIssueSchema.parse(req.body);
  const updated = await prisma.issue.update({ where: { id: req.params.id }, data: input });
  res.json(updated);
}
