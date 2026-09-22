"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { formatFcfa, monthLabel } from "@/lib/format";
import toast from "react-hot-toast";

interface NotificationSummary {
  dueSoon: number;
  dueToday: number;
  late: number;
  contractExpiring: number;
  skippedNoEmail: number;
  errors: string[];
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
      if (result.errors && result.errors.length > 0) {
        toast.error(`Certains envois ont échoué. Voir les détails ci-dessous.`, { duration: 6000 });
      } else {
        toast.success("Opération terminée !");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Impossible d'envoyer les rappels.";
      setNotifError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
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

          <div className="mb-6 border border-petrole-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-petrole-800 sm:text-lg">Rappels de loyer</h2>
                <p className="text-sm text-petrole-500">
                  Envoie par email les rappels d'échéance et de retard aux locataires (une seule fois par échéance).
                </p>
              </div>
              <button
                onClick={handleSendReminders}
                disabled={sending}
                className="w-full shrink-0 bg-petrole-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
              >
                {sending ? "Envoi…" : "Envoyer les rappels"}
              </button>
            </div>
            {notifError && <p className="mt-3 text-sm text-red-700">{notifError}</p>}
            {notifResult && (
              <div className="mt-4 rounded border border-petrole-200 bg-petrole-50 p-3 text-sm text-petrole-800">
                <p className="font-semibold mb-1">Résumé de l'opération :</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                  <li>{notifResult.dueSoon} rappel(s) d'échéance proche</li>
                  <li>{notifResult.dueToday} rappel(s) pour échéance du jour</li>
                  <li>{notifResult.late} rappel(s) de retard</li>
                  <li>{notifResult.contractExpiring} rappel(s) de fin de contrat</li>
                </ul>
                {notifResult.skippedNoEmail > 0 && (
                  <p className="text-or-600 font-medium">
                    ⚠️ {notifResult.skippedNoEmail} locataire(s) ignoré(s) (pas d'adresse email).
                  </p>
                )}
                {notifResult.errors && notifResult.errors.length > 0 && (
                  <div className="mt-3 border-t border-petrole-200 pt-2 text-red-700">
                    <p className="font-medium mb-1">Erreurs rencontrées :</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {notifResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <section>
            <h2 className="mb-3 font-display text-base font-bold text-petrole-800 sm:text-lg">Locataires en retard</h2>
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
