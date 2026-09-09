import crypto from "node:crypto";
import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { assertPropertyAccess, ownerFilter } from "../../lib/ownership";
import { ApiError } from "../../middleware/errorHandler";
import { createPaymentSchema } from "./payments.schema";
import { generateReceiptPdf } from "./receipt.pdf";

async function assertPaymentAccess(
  payment: { propertyId: string; tenant: { userId: string | null } },
  user: { userId: string; role: string }
) {
  if (user.role === "TENANT") {
    if (payment.tenant.userId !== user.userId) {
      throw new ApiError(403, "Vous n'avez pas accès à ce paiement.");
    }
    return;
  }
  await assertPropertyAccess(payment.propertyId, user);
}

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HBT-${year}-${random}`;
}

export async function create(req: Request, res: Response) {
  const input = createPaymentSchema.parse(req.body);

  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const payment = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      propertyId: tenant.propertyId,
      amount: input.amount,
      period: input.period,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      method: input.method,
      comment: input.comment,
      receiptNumber: generateReceiptNumber(),
      recordedById: req.user!.userId,
    },
  });

  res.status(201).json(payment);
}

export async function listRecent(req: Request, res: Response) {
  const payments = await prisma.payment.findMany({
    where: { property: ownerFilter(req.user!) },
    include: { tenant: true, property: { select: { name: true } } },
    orderBy: { paymentDate: "desc" },
    take: 50,
  });
  res.json(payments);
}

export async function listByTenant(req: Request, res: Response) {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } });
  if (!tenant) throw new ApiError(404, "Locataire introuvable.");
  await assertPropertyAccess(tenant.propertyId, req.user!);

  const payments = await prisma.payment.findMany({
    where: { tenantId: tenant.id },
    orderBy: { period: "desc" },
  });
  res.json(payments);
}

export async function getReceipt(req: Request, res: Response) {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { tenant: true, property: true },
  });
  if (!payment) throw new ApiError(404, "Paiement introuvable.");
  await assertPaymentAccess(payment, req.user!);

  res.json(payment);
}

export async function downloadReceiptPdf(req: Request, res: Response) {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { tenant: { include: { unit: true } }, property: true },
  });
  if (!payment) throw new ApiError(404, "Paiement introuvable.");
  await assertPaymentAccess(payment, req.user!);

  const pdf = await generateReceiptPdf({
    receiptNumber: payment.receiptNumber,
    amount: Number(payment.amount),
    period: payment.period,
    paymentDate: payment.paymentDate,
    method: payment.method,
    comment: payment.comment,
    propertyName: payment.property.name,
    propertyAddress: payment.property.address,
    unitLabel: payment.tenant.unit?.identifier,
    tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="recu-${payment.receiptNumber}.pdf"`);
  res.send(pdf);
}
