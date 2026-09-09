"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { Issue } from "@/lib/types";

const STATUS_LABEL: Record<Issue["status"], string> = {
  OPEN: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
};

const STATUS_STYLE: Record<Issue["status"], string> = {
  OPEN: "bg-or-100 text-or-600",
  IN_PROGRESS: "bg-petrole-100 text-petrole-700",
  RESOLVED: "bg-petrole-50 text-petrole-500",
};

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    return api.get<Issue[]>("/issues").then(setIssues);
  }

  useEffect(() => {
    refresh()
      .catch(() => setError("Impossible de charger les signalements."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-xl font-bold text-petrole-800 sm:text-2xl">Signalements</h1>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && issues.length === 0 && (
        <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
          Aucun signalement pour l'instant.
        </p>
      )}

      <div className="space-y-4">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onChanged={refresh} />
        ))}
      </div>
    </AppShell>
  );
}

function IssueCard({ issue, onChanged }: { issue: Issue; onChanged: () => void }) {
  const [response, setResponse] = useState(issue.response ?? "");
  const [assignedProvider, setAssignedProvider] = useState(issue.assignedProvider ?? "");
  const [status, setStatus] = useState(issue.status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.patch(`/issues/${issue.id}`, { status, response: response || undefined, assignedProvider: assignedProvider || undefined });
      setExpanded(false); // Fermer le formulaire après sauvegarde
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour ce signalement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-petrole-200 bg-white p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-petrole-800">
            {issue.category} · {issue.tenant?.firstName} {issue.tenant?.lastName} · {issue.property?.name}
          </p>
          <p className="text-xs text-petrole-500">{new Date(issue.createdAt).toLocaleDateString("fr-FR")}</p>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[issue.status]}`}>{STATUS_LABEL[issue.status]}</span>
      </div>

      <p className="mb-3 text-sm text-petrole-700">{issue.description}</p>
      {issue.photoUrl && (
        <a href={issue.photoUrl} target="_blank" rel="noreferrer" className="mb-3 inline-block text-xs text-or-600 underline">
          Voir la photo jointe
        </a>
      )}

      <button onClick={() => setExpanded((s) => !s)} className="text-xs text-petrole-500 underline">
        {expanded ? "Fermer" : "Répondre / traiter"}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-3 border-t border-petrole-100 pt-3">
          {error && <p className="mb-3 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-xs">{error}</p>}
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Issue["status"])}
                className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
              >
                <option value="OPEN">Nouveau</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="RESOLVED">Résolu</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Prestataire assigné (optionnel)</label>
              <input
                value={assignedProvider}
                onChange={(e) => setAssignedProvider(e.target.value)}
                placeholder="Nom, contact…"
                className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
              />
            </div>
          </div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Réponse au locataire (optionnel)</label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            className="mb-3 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60"
          >
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </div>
  );
}
