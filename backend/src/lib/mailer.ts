import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let smtpConfigured = false;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  smtpConfigured = true;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Aucun fournisseur d'email n'est configuré par défaut dans ce MVP (voir
 * MANUAL_STEPS.md) — sans SMTP_HOST/SMTP_USER/SMTP_PASS dans les variables
 * d'environnement, cette fonction se contente de logger le mail au lieu de
 * l'envoyer. C'est délibéré : mieux vaut un rappel visible dans les logs
 * Render qu'une erreur qui casse le job de notifications parce qu'un compte
 * SMTP n'a pas encore été configuré.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  const client = getTransporter();

  if (!client) {
    console.log(`[mailer] SMTP non configuré — email non envoyé à ${to} : "${subject}"`);
    return false;
  }

  await client.sendMail({
    from: process.env.MAIL_FROM || "HaBiTa <no-reply@habita.app>",
    to,
    subject,
    html,
  });
  return true;
}

export function isEmailConfigured(): boolean {
  getTransporter();
  return smtpConfigured;
}
