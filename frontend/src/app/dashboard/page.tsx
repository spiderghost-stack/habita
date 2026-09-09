"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { formatFcfa, monthLabel } from "@/lib/format";

interface NotificationSummary {
  dueSoon: number;
  dueToday: number;
  late: number;
  contractExpiring: number;
  skippedNoEmail: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifResult, setNotifResult] = useState<NotificationSummary | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get<DashboardSummary>("/dashboard/summary")
      .then(setData)
      .catch(() => setError("Impossible de charger le tableau de bord."));
  }, []);

  async function handleSendReminders() {
    setSending(true);
    setNotifError(null);
    setNotifResult(null);
    try {
      const result = await api.post<NotificationSummary>("/notifications/run-mine");
      setNotifResult(result);
    } catch (err) {
      setNotifError(err instanceof ApiError ? err.message : "Impossible d'envoyer les rappels.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="font-display text-2xl text-petrole-800">Tableau de bord</h1>
        {data && <span className="text-sm text-petrole-500">{monthLabel(data.period)}</span>}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!data && !error && <p className="text-sm text-petrole-500">Chargement des chiffres du mois…</p>}

      {data && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden border border-petrole-200 bg-petrole-200 md:grid-cols-4">
            <Stat label="Loyers attendus" value={formatFcfa(data.rentExpected)} />
            <Stat label="Loyers collectés" value={formatFcfa(data.rentCollected)} accent="petrole" />
            <Stat label="Impayés" value={formatFcfa(data.rentOutstanding)} accent={data.rentOutstanding > 0 ? "or" : undefined} />
            <Stat label="Locataires en retard" value={String(data.lateCount)} accent={data.lateCount > 0 ? "or" : undefined} />
          </div>

          <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden border border-petrole-200 bg-petrole-200">
            <Stat label="Propriétés" value={String(data.properties)} compact />
            <Stat label="Unités" value={String(data.units)} compact />
            <Stat label="Taux d'occupation" value={`${data.occupancyRate}%`} compact />
          </div>

          <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden border border-petrole-200 bg-petrole-200 md:grid-cols-3">
            <Stat label="Dépenses" value={formatFcfa(data.totalExpenses)} />
            <Stat
              label="Revenu net"
              value={formatFcfa(data.netIncome)}
              accent={data.netIncome < 0 ? "or" : "petrole"}
            />
          </div>

          <div className="mb-8 border border-petrole-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-petrole-800">Rappels de loyer</h2>
                <p className="text-sm text-petrole-500">
                  Envoie par email les rappels d'échéance et de retard aux locataires concernés (une seule fois par échéance).
                </p>
              </div>
              <button
                onClick={handleSendReminders}
                disabled={sending}
                className="whitespace-nowrap bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
              >
                {sending ? "Envoi…" : "Envoyer les rappels maintenant"}
              </button>
            </div>
            {notifError && <p className="mt-3 text-sm text-red-700">{notifError}</p>}
            {notifResult && (
              <p className="mt-3 text-sm text-petrole-600">
                {notifResult.dueSoon + notifResult.dueToday + notifResult.late + notifResult.contractExpiring} email(s) envoyé(s)
                {" "}({notifResult.dueSoon} échéance proche, {notifResult.dueToday} échéance du jour, {notifResult.late} retard, {notifResult.contractExpiring} contrat expirant)
                {notifResult.skippedNoEmail > 0 && ` · ${notifResult.skippedNoEmail} locataire(s) sans email ignoré(s)`}.
              </p>
            )}
          </div>

          <section>
            <h2 className="mb-3 font-display text-lg text-petrole-800">Locataires en retard</h2>
            {data.lateTenants.length === 0 ? (
              <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
                Aucun retard ce mois-ci.
              </p>
            ) : (
              <div className="border border-petrole-200 bg-white">
                {data.lateTenants.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tenants/${t.id}`}
                    className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0 hover:bg-fond"
                  >
                    <div>
                      <p className="text-petrole-800">{t.name}</p>
                      <p className="text-xs text-petrole-500">{t.unit ?? "Unité non assignée"} · échéance le {t.dueDay}</p>
                    </div>
                    <span className="text-or-600">{formatFcfa(t.rentAmount)}</span>
                  </Link>
                ))}
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
    <div className="bg-white px-4 py-5">
      <p className="mb-1 text-xs uppercase tracking-wide text-petrole-500">{label}</p>
      <p
        className={`font-display ${compact ? "text-lg" : "text-2xl"} ${
          accent === "or" ? "text-or-600" : accent === "petrole" ? "text-petrole-600" : "text-petrole-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
