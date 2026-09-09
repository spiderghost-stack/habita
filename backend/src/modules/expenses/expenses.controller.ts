import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { limitsFor } from "../../lib/plans";
import { createExpenseSchema, updateExpenseSchema } from "./expenses.schema";

export async function list(req: Request, res: Response) {
  const propertyId = req.query.propertyId as string | undefined;
  if (propertyId) await assertPropertyAccess(propertyId, req.user!);

  const where = propertyId
    ? { propertyId }
    : { property: ownerFilter(req.user!) };

  const expenses = await prisma.expense.findMany({
    where,
    include: { property: { select: { name: true } } },
    orderBy: { expenseDate: "desc" },
    take: 100,
  });
  res.json(expenses);
}

export async function create(req: Request, res: Response) {
  const input = createExpenseSchema.parse(req.body);
  const property = await assertPropertyAccess(input.propertyId, req.user!);

  const owner = await prisma.user.findUnique({ where: { id: property.ownerId } });
  if (!limitsFor(owner!.plan).canUseExpenses) {
    throw new ApiError(402, `Le suivi des dépenses nécessite le plan Pro ou Business (plan actuel : ${owner!.plan}).`);
  }

  const expense = await prisma.expense.create({
    data: {
      propertyId: input.propertyId,
      label: input.label,
      amount: input.amount,
      category: input.category,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      comment: input.comment,
      recordedById: req.user!.userId,
    },
  });
  res.status(201).json(expense);
}

export async function update(req: Request, res: Response) {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new ApiError(404, "Dépense introuvable.");
  await assertPropertyAccess(expense.propertyId, req.user!);

  const input = updateExpenseSchema.parse(req.body);
  const updated = await prisma.expense.update({
    where: { id: req.params.id },
    data: { ...input, expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined },
  });
  res.json(updated);
}

export async function remove(req: Request, res: Response) {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new ApiError(404, "Dépense introuvable.");
  await assertPropertyAccess(expense.propertyId, req.user!);

  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
