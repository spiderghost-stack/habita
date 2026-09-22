"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { formatFcfa, monthLabel } from "@/lib/format";
import { MessageCircle } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
      window.history.replaceState(null, "", "/dashboard");
    }

    api
      .get<DashboardSummary>("/dashboard/summary")
      .then(setData)
      .catch(() => setError("Impossible de charger le tableau de bord."));
  }, []);

  return (
    <AppShell>
      {paymentSuccess && (
        <div className="mb-6 border-l-4 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-800">
          <strong>Paiement réussi !</strong> Votre plan a été mis à jour avec succès.
        </div>
      )}
      
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-petrole-800 sm:text-2xl">Tableau de bord</h1>
        {data && <span className="text-sm font-medium text-petrole-500">{monthLabel(data.period)}</span>}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!data && !error && <p className="text-sm text-petrole-500">Chargement des chiffres du mois…</p>}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden border border-petrole-200 bg-petrole-200 sm:grid-cols-2 md:grid-cols-4">
            <Stat label="Loyers attendus" value={formatFcfa(data.rentExpected)} />
            <Stat label="Loyers collectés" value={formatFcfa(data.rentCollected)} accent="petrole" />
            <Stat label="Impayés" value={formatFcfa(data.rentOutstanding)} accent={data.rentOutstanding > 0 ? "or" : undefined} />
            <Stat label="En retard" value={String(data.lateCount)} accent={data.lateCount > 0 ? "or" : undefined} />
          </div>

          <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden border border-petrole-200 bg-petrole-200">
            <Stat label="Propriétés" value={String(data.properties)} compact />
            <Stat label="Unités" value={String(data.units)} compact />
            <Stat label="Occupation" value={`${data.occupancyRate}%`} compact />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden border border-petrole-200 bg-petrole-200">
            <Stat label="Dépenses" value={formatFcfa(data.totalExpenses)} />
            <Stat
              label="Revenu net"
              value={formatFcfa(data.netIncome)}
              accent={data.netIncome < 0 ? "or" : "petrole"}
            />
          </div>


          <section>
            <h2 className="mb-3 font-display text-base font-bold text-petrole-800 sm:text-lg">Locataires en retard</h2>
            {data.lateTenants.length === 0 ? (
              <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
                Aucun retard ce mois-ci.
              </p>
            ) : (
              <div className="border border-petrole-200 bg-white">
                {data.lateTenants.map((t) => {
                  const messageText = encodeURIComponent(
                    `Bonjour ${t.name}, sauf erreur de notre part, votre loyer de ${formatFcfa(t.rentAmount)} pour ce mois est actuellement en retard. Pourriez-vous régulariser la situation ? Merci.`
                  );
                  const cleanPhone = t.phone.replace(/[^0-9]/g, "");

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0 hover:bg-fond"
                    >
                      <Link href={`/tenants/${t.id}`} className="flex-1">
                        <p className="text-petrole-800">{t.name}</p>
                        <p className="text-xs text-petrole-500">{t.unit ?? "Unité non assignée"} · échéance le {t.dueDay}</p>
                      </Link>
                      <div className="flex items-center gap-4">
                        <span className="text-or-600 font-medium">{formatFcfa(t.rentAmount)}</span>
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${messageText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 items-center gap-2 rounded bg-green-50 px-3 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Relancer</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
  compact,
}: {
  label: string;
  value: string;
  accent?: "petrole" | "or";
  compact?: boolean;
}) {
  return (
    <div className="bg-white px-3 py-4 sm:px-4 sm:py-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-petrole-500">{label}</p>
      <p
        className={`font-display font-bold ${compact ? "text-lg" : "text-xl sm:text-2xl"} ${
          accent === "or" ? "text-or-600" : accent === "petrole" ? "text-petrole-600" : "text-petrole-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
