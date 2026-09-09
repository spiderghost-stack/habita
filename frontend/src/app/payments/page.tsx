"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { api, downloadFile } from "@/lib/api";
import { formatFcfa } from "@/lib/format";

interface PaymentRow {
  id: string;
  tenantId: string;
  amount: string;
  period: string;
  paymentDate: string;
  method: string;
  receiptNumber: string;
  tenant: { firstName: string; lastName: string };
  property: { name: string };
}

const METHOD_LABEL: Record<string, string> = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  MOBILE_MONEY: "Mobile Money",
  CHECK: "Chèque",
  OTHER: "Autre",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PaymentRow[]>("/payments")
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <h1 className="mb-8 font-display text-2xl text-petrole-800">Paiements récents</h1>

      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && payments.length === 0 && (
        <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
          Aucun paiement enregistré pour l'instant. Ouvrez la fiche d'un locataire pour en ajouter un.
        </p>
      )}

      <div className="border border-petrole-200 bg-white">
        {payments.map((p) => (
          <PaymentRow key={p.id} payment={p} />
        ))}
      </div>
    </AppShell>
  );
}

function PaymentRow({ payment: p }: { payment: PaymentRow }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadFile(`/payments/${p.id}/receipt.pdf`, `recu-${p.receiptNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Link
      href={`/tenants/${p.tenantId}`}
      className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0 hover:bg-fond"
    >
      <div>
        <p className="text-petrole-800">{p.tenant.firstName} {p.tenant.lastName} · {p.property.name}</p>
        <p className="text-xs text-petrole-500">
          {p.period} · {new Date(p.paymentDate).toLocaleDateString("fr-FR")} · {METHOD_LABEL[p.method]} · {p.receiptNumber}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleDownload} disabled={downloading} className="text-xs text-or-600 underline disabled:opacity-60">
          {downloading ? "…" : "Reçu PDF"}
        </button>
        <span className="text-petrole-700">{formatFcfa(p.amount)}</span>
      </div>
    </Link>
  );
}
