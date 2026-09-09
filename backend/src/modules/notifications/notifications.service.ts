import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../lib/mailer";
import { currentPeriod } from "../../lib/rentStatus";

interface NotificationSummary {
  dueSoon: number;
  dueToday: number;
  late: number;
  contractExpiring: number;
  skippedNoEmail: number;
}

// Une seule fonction, appelée à la fois par le job cron global (toutes les
// propriétés) et par le déclenchement manuel d'un propriétaire (ses
// propriétés uniquement) — voir notifications.controller.ts.
export async function runNotifications(propertyFilter: Record<string, unknown>): Promise<NotificationSummary> {
  const summary: NotificationSummary = { dueSoon: 0, dueToday: 0, late: 0, contractExpiring: 0, skippedNoEmail: 0 };
  const period = currentPeriod();
  const today = new Date();

  const properties = await prisma.property.findMany({ where: propertyFilter, select: { id: true } });
  const propertyIds = properties.map((p) => p.id);
  if (propertyIds.length === 0) return summary;

  const tenants = await prisma.tenant.findMany({
    where: { propertyId: { in: propertyIds }, active: true },
    include: { payments: { where: { period } }, unit: true, property: true },
  });

  for (const tenant of tenants) {
    if (!tenant.email) {
      summary.skippedNoEmail++;
      continue;
    }

    const paidThisMonth = tenant.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (paidThisMonth >= Number(tenant.rentAmount)) continue; // déjà à jour, rien à rappeler

    const daysUntilDue = tenant.dueDay - today.getDate();

    if (daysUntilDue === 3) {
      const sent = await trySend("RENT_DUE_SOON", tenant.id, period, {
        to: tenant.email,
        subject: "Votre loyer arrive bientôt à échéance",
        html: reminderEmail(tenant.firstName, tenant.rentAmount, "arrive à échéance dans 3 jours."),
      });
      if (sent) summary.dueSoon++;
    } else if (daysUntilDue === 0) {
      const sent = await trySend("RENT_DUE_TODAY", tenant.id, period, {
        to: tenant.email,
        subject: "Votre loyer est dû aujourd'hui",
        html: reminderEmail(tenant.firstName, tenant.rentAmount, "est dû aujourd'hui."),
      });
      if (sent) summary.dueToday++;
    } else if (daysUntilDue < 0) {
      const daysLate = -daysUntilDue;
      // Rappel le premier jour de retard, puis un rappel hebdomadaire plutôt
      // qu'un email chaque jour — un locataire en retard de 20 jours n'a pas
      // besoin de 20 emails identiques.
      if (daysLate === 1 || daysLate % 7 === 0) {
        const sent = await trySend("RENT_LATE", tenant.id, `${period}:day${daysLate}`, {
          to: tenant.email,
          subject: "Retard de paiement de loyer",
          html: reminderEmail(
            tenant.firstName,
            tenant.rentAmount,
            `présente actuellement un retard de ${daysLate} jour${daysLate > 1 ? "s" : ""}.`
          ),
        });
        if (sent) summary.late++;
      }
    }
  }

  const expiringContracts = await prisma.contract.findMany({
    where: { propertyId: { in: propertyIds }, status: "ACTIVE" },
    include: { tenant: true },
  });

  for (const contract of expiringContracts) {
    if (!contract.tenant.email) continue;
    const daysUntilExpiry = Math.ceil((contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry !== 30) continue;

    const dedupeKey = contract.endDate.toISOString().slice(0, 10);
    const sent = await trySend("CONTRACT_EXPIRING", contract.id, dedupeKey, {
      to: contract.tenant.email,
      subject: "Votre contrat de location arrive à échéance",
      html: `<p>Bonjour ${contract.tenant.firstName},</p><p>Votre contrat de location arrive à échéance le ${contract.endDate.toLocaleDateString("fr-FR")} (dans 30 jours). Contactez votre propriétaire si vous souhaitez le renouveler.</p>`,
    });
    if (sent) summary.contractExpiring++;
  }

  return summary;
}

async function trySend(
  type: string,
  subjectId: string,
  period: string,
  email: { to: string; subject: string; html: string }
): Promise<boolean> {
  const existing = await prisma.notificationLog.findUnique({
    where: { type_subjectId_period: { type, subjectId, period } },
  });
  if (existing) return false; // déjà envoyé pour cette échéance précise

  const delivered = await sendEmail(email);
  if (!delivered) return false; // SMTP non configuré : on ne marque pas comme envoyé, pour pouvoir réessayer plus tard

  await prisma.notificationLog.create({ data: { type, subjectId, period } });
  return true;
}

function reminderEmail(firstName: string, rentAmount: unknown, statusSentence: string): string {
  const amount = Number(rentAmount).toLocaleString("fr-FR");
  return `<p>Bonjour ${firstName} 👋</p><p>Votre loyer de ${amount} FCFA ${statusSentence}</p>`;
}
