"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, downloadFile } from "@/lib/api";
import { MonthlyReport, Property } from "@/lib/types";
import { formatFcfa, monthLabel } from "@/lib/format";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    api.get<Property[]>("/properties").then(setProperties);
  }, []);

  function query() {
    const params = new URLSearchParams({ period });
    if (propertyId) params.set("propertyId", propertyId);
    return params.toString();
  }

  function refresh() {
    setLoading(true);
    setError(null);
    return api
      .get<MonthlyReport>(`/reports/monthly?${query()}`)
      .then(setReport)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger le rapport."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, period]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadFile(`/reports/monthly.csv?${query()}`, `rapport-habita-${period}.csv`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setSentTo(null);
    setError(null);
    try {
      const result = await api.post<{ sent: boolean; to: string }>(`/reports/monthly/send?${query()}`);
      if (result.sent) {
        setSentTo(result.to);
      } else {
        setError(
          "⚠️ L'email n'a pas pu être envoyé : le serveur SMTP n'est pas configuré. " +
          "Veuillez ajouter les variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et MAIL_FROM dans les paramètres de votre service sur Render."
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Envoi impossible. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-petrole-800 sm:text-2xl">Rapports</h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          >
            <option value="">Toutes les propriétés</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
        </div>
      </div>

      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {report && !loading && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60"
            >
              {downloading ? "…" : "Télécharger en CSV"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="border border-petrole-300 px-4 py-2 text-sm font-semibold text-petrole-700 hover:bg-petrole-50 disabled:opacity-60"
            >
              {sending ? "Envoi…" : "M'envoyer ce rapport par email"}
            </button>
          </div>
          {sentTo && <p className="mb-4 text-sm text-petrole-600">Rapport envoyé à {sentTo}.</p>}

          <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden border border-petrole-200 bg-petrole-200 sm:grid-cols-2 md:grid-cols-4">
            <Stat label={`Collecté — ${monthLabel(period)}`} value={formatFcfa(report.totals.rentCollected)} />
            <Stat label="Dépenses" value={formatFcfa(report.totals.totalExpenses)} />
            <Stat label="Net" value={formatFcfa(report.totals.netIncome)} accent={report.totals.netIncome < 0 ? "or" : "petrole"} />
            <Stat label="Occupation moy." value={`${report.totals.occupancyRate}%`} />
          </div>

          <div className="overflow-x-auto border border-petrole-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-petrole-200 text-xs uppercase tracking-wide text-petrole-500">
                <tr>
                  <th className="px-4 py-3">Propriété</th>
                  <th className="px-4 py-3">Attendu</th>
                  <th className="px-4 py-3">Collecté</th>
                  <th className="px-4 py-3">Impayés</th>
                  <th className="px-4 py-3">Dépenses</th>
                  <th className="px-4 py-3">Net</th>
                  <th className="px-4 py-3">Occupation</th>
                  <th className="px-4 py-3">Nouveaux locataires</th>
                </tr>
              </thead>
              <tbody>
                {report.properties.map((r) => (
                  <tr key={r.propertyId} className="border-b border-petrole-100 last:border-b-0">
                    <td className="px-4 py-3 text-petrole-800">{r.propertyName}</td>
                    <td className="px-4 py-3">{formatFcfa(r.rentExpected)}</td>
                    <td className="px-4 py-3">{formatFcfa(r.rentCollected)}</td>
                    <td className="px-4 py-3">{formatFcfa(r.rentOutstanding)}</td>
                    <td className="px-4 py-3">{formatFcfa(r.totalExpenses)}</td>
                    <td className="px-4 py-3">{formatFcfa(r.netIncome)}</td>
                    <td className="px-4 py-3">{r.occupancyRate}%</td>
                    <td className="px-4 py-3">{r.newTenants}</td>
                  </tr>
                ))}
                {report.properties.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-petrole-500">
                      Aucune donnée pour cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "petrole" | "or" }) {
  return (
    <div className="bg-white px-3 py-4 sm:px-4 sm:py-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-petrole-500">{label}</p>
      <p className={`font-display text-lg font-bold ${accent === "or" ? "text-or-600" : "text-petrole-800"}`}>{value}</p>
    </div>
  );
}
