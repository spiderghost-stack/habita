import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { PassThrough } from "node:stream";

const METHOD_LABEL: Record<string, string> = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement bancaire",
  MOBILE_MONEY: "Mobile Money",
  CHECK: "Chèque",
  OTHER: "Autre",
};

interface ReceiptData {
  receiptNumber: string;
  amount: number;
  period: string;
  paymentDate: Date;
  method: string;
  comment?: string | null;
  propertyName: string;
  propertyAddress: string;
  unitLabel?: string | null;
  tenantName: string;
}

// Le QR code encode une chaîne simple (pas d'URL de vérification en ligne
// pour l'instant, puisqu'il n'y a pas encore d'espace locataire public où la
// pointer) : numéro de reçu, propriété, montant, date. Suffisant pour qu'un
// propriétaire ou un locataire puisse re-saisir ces informations à la main
// en cas de litige, sans dépendre d'un service externe.
function buildQrPayload(data: ReceiptData): string {
  return [
    `Reçu: ${data.receiptNumber}`,
    `Propriété: ${data.propertyName}`,
    `Locataire: ${data.tenantName}`,
    `Montant: ${data.amount.toLocaleString("fr-FR")} FCFA`,
    `Période: ${data.period}`,
    `Date: ${data.paymentDate.toLocaleDateString("fr-FR")}`,
  ].join("\n");
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(buildQrPayload(data), { margin: 1, width: 160 });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const doc = new PDFDocument({ size: "A5", margin: 40 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk) => chunks.push(chunk));
  doc.pipe(stream);

  // En-tête
  doc
    .fillColor("#164a45")
    .fontSize(20)
    .text("HaBiTa", { continued: false })
    .fontSize(10)
    .fillColor("#555555")
    .text("Reçu de paiement de loyer")
    .moveDown(1);

  doc
    .fillColor("#0f3733")
    .fontSize(9)
    .text(`Reçu N° ${data.receiptNumber}`, { align: "right" })
    .text(`Émis le ${new Date().toLocaleDateString("fr-FR")}`, { align: "right" })
    .moveDown(1);

  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor("#d3e6e4").stroke();
  doc.moveDown(1);

  // Détails
  const row = (label: string, value: string) => {
    doc
      .fillColor("#8c9b98")
      .fontSize(8)
      .text(label.toUpperCase())
      .fillColor("#0f3733")
      .fontSize(12)
      .text(value)
      .moveDown(0.6);
  };

  row("Locataire", data.tenantName);
  row("Propriété", `${data.propertyName} — ${data.propertyAddress}`);
  if (data.unitLabel) row("Unité", data.unitLabel);
  row("Période couverte", data.period);
  row("Mode de paiement", METHOD_LABEL[data.method] ?? data.method);
  row("Date du paiement", data.paymentDate.toLocaleDateString("fr-FR"));
  if (data.comment) row("Commentaire", data.comment);

  doc.moveDown(0.5);
  doc
    .fillColor("#b17f28")
    .fontSize(22)
    .text(`${data.amount.toLocaleString("fr-FR")} FCFA`, { align: "left" })
    .moveDown(1);

  // QR code en bas de page
  const qrY = doc.page.height - 200;
  doc.image(qrBuffer, 40, qrY, { width: 100 });
  doc
    .fillColor("#8c9b98")
    .fontSize(7)
    .text("Ce QR code résume les informations de ce reçu.", 150, qrY + 35, { width: 250 });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
