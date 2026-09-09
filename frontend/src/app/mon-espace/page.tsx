"use client";

import { FormEvent, useEffect, useState } from "react";
import { TenantShell } from "@/components/TenantShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError, downloadFile } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { formatFcfa } from "@/lib/format";

interface TenantMe {
  id: string;
  firstName: string;
  lastName: string;
  rentAmount: string;
  dueDay: number;
  status: "UP_TO_DATE" | "DUE_SOON" | "LATE";
  property: { name: string; address: string };
  unit: { identifier: string; type: string | null } | null;
}

interface TenantPayment {
  id: string;
  amount: string;
  period: string;
  paymentDate: string;
  method: string;
  receiptNumber: string;
}

interface TenantIssue {
  id: string;
  category: string;
  description: string;
  photoUrl?: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  response?: string | null;
  createdAt: string;
}

const ISSUE_STATUS_LABEL: Record<TenantIssue["status"], string> = {
  OPEN: "Envoyé",
  IN_PROGRESS: "En cours de traitement",
  RESOLVED: "Résolu",
};

const METHOD_LABEL: Record<string, string> = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  MOBILE_MONEY: "Mobile Money",
  CHECK: "Chèque",
  OTHER: "Autre",
};

export default function TenantPortalPage() {
  const [me, setMe] = useState<TenantMe | null>(null);
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [issues, setIssues] = useState<TenantIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  function refreshIssues() {
    return api.get<TenantIssue[]>("/tenant-portal/issues").then(setIssues);
  }

  useEffect(() => {
    Promise.all([
      api.get<TenantMe>("/tenant-portal/me"),
      api.get<TenantPayment[]>("/tenant-portal/payments"),
      refreshIssues(),
    ])
      .then(([meData, paymentsData]) => {
        setMe(meData);
        setPayments(paymentsData);
      })
      .catch(() => setError("Impossible de charger votre espace pour l'instant."));
  }, []);

  if (error) {
    return (
      <TenantShell>
        <p className="text-sm text-red-700">{error}</p>
      </TenantShell>
    );
  }

  if (!me) {
    return (
      <TenantShell>
        <p className="text-sm text-petrole-500">Chargement…</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell>
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-xl font-bold text-petrole-800 sm:text-2xl">Bonjour {me.firstName}</h1>
          <p className="text-sm text-petrole-500">{me.property.name} — {me.property.address}</p>
        </div>
        <StatusBadge status={me.status} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-px overflow-hidden border border-petrole-200 bg-petrole-200 sm:grid-cols-2">
        <div className="bg-white px-4 py-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-petrole-500">Logement</p>
          <p className="font-display text-lg font-bold text-petrole-800">{me.unit?.identifier ?? "Non assigné"}</p>
        </div>
        <div className="bg-white px-4 py-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-petrole-500">Loyer mensuel</p>
          <p className="font-display text-lg font-bold text-petrole-800">{formatFcfa(me.rentAmount)}</p>
        </div>
        <div className="bg-white px-4 py-4 sm:col-span-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-petrole-500">Échéance</p>
          <p className="font-display text-lg font-bold text-petrole-800">Le {me.dueDay} de chaque mois</p>
        </div>
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-petrole-800">Historique des paiements</h2>
      <div className="border border-petrole-200 bg-white">
        {payments.length === 0 && (
          <p className="px-4 py-6 text-sm text-petrole-500">Aucun paiement enregistré pour l'instant.</p>
        )}
        {payments.map((p) => (
          <PaymentRow key={p.id} payment={p} />
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-petrole-800">Signaler un problème</h2>
      <IssueSection issues={issues} onCreated={refreshIssues} />

      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-petrole-800">Messages</h2>
      <MessagesSection />

      <p className="mt-6 text-xs text-petrole-400">
        Vous ne pouvez pas encore payer votre loyer directement depuis cet espace — c'est prévu pour une
        prochaine version. Pour toute question, contactez directement votre propriétaire.
      </p>
    </TenantShell>
  );
}

function MessagesSection() {
  const [messages, setMessages] = useState<
    Array<{ id: string; senderRole: string; body: string; createdAt: string }>
  >([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function refresh() {
    return api.get<typeof messages>("/tenant-portal/messages").then(setMessages);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setSending(true);
    try {
      await api.post("/tenant-portal/messages", { body });
      setBody("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer ce message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-8 border border-petrole-200 bg-white">
      <div className="max-h-72 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-petrole-500">Aucun message pour l'instant.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] ${m.senderRole === "TENANT" ? "ml-auto" : ""}`}>
            <div className={`px-3 py-2 text-sm ${m.senderRole === "TENANT" ? "bg-petrole-700 text-white" : "bg-fond text-petrole-800"}`}>
              {m.body}
            </div>
            <p className={`mt-1 text-xs text-petrole-400 ${m.senderRole === "TENANT" ? "text-right" : ""}`}>
              {new Date(m.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-petrole-100 p-4">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire à votre propriétaire…"
          className="flex-1 border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
        >
          {sending ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

function IssueSection({ issues, onCreated }: { issues: TenantIssue[]; onCreated: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/tenant-portal/issues", { category, description, photoUrl: photoUrl || undefined });
      setCategory("");
      setDescription("");
      setPhotoUrl("");
      setShowForm(false);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer ce signalement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-8">
      <button onClick={() => setShowForm((s) => !s)} className="mb-3 text-sm text-or-600 underline">
        {showForm ? "Annuler" : "+ Nouveau signalement"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 border border-petrole-200 bg-white p-4">
          {error && <p className="mb-3 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Catégorie</label>
          <input
            required
            placeholder="Plomberie, électricité…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-3 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Description</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-3 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">
            Photo (optionnel)
          </label>
          <div className="mb-3 flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setError(null);
                try {
                  const url = await uploadImage(file);
                  setPhotoUrl(url);
                } catch {
                  setError("Envoi de la photo impossible pour l'instant (voir avec votre propriétaire).");
                } finally {
                  setUploading(false);
                }
              }}
              className="text-sm text-petrole-600"
            />
            {uploading && <span className="text-xs text-petrole-500">Envoi…</span>}
            {photoUrl && !uploading && <span className="text-xs text-petrole-500">Photo jointe ✓</span>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full shrink-0 bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Envoi…" : "Envoyer le signalement"}
          </button>
        </form>
      )}

      <div className="border border-petrole-200 bg-white">
        {issues.length === 0 && (
          <p className="px-4 py-6 text-sm text-petrole-500">Aucun signalement envoyé pour l'instant.</p>
        )}
        {issues.map((issue) => (
          <div key={issue.id} className="border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-petrole-800">{issue.category}</p>
              <span className="text-xs text-petrole-500">{ISSUE_STATUS_LABEL[issue.status]}</span>
            </div>
            <p className="text-petrole-600">{issue.description}</p>
            {issue.response && (
              <p className="mt-2 border-l-2 border-petrole-300 pl-2 text-xs text-petrole-500">
                Réponse du propriétaire : {issue.response}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: TenantPayment }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadFile(`/payments/${payment.id}/receipt.pdf`, `recu-${payment.receiptNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0 hover:bg-fond">
      <div className="min-w-0 flex-1 pr-3">
        <p className="truncate font-medium text-petrole-800">{payment.period}</p>
        <p className="truncate text-xs text-petrole-500">
          {new Date(payment.paymentDate).toLocaleDateString("fr-FR")} · {METHOD_LABEL[payment.method]}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button onClick={handleDownload} disabled={downloading} className="text-xs font-medium text-or-600 underline disabled:opacity-60">
          {downloading ? "…" : "PDF"}
        </button>
        <span className="font-semibold text-petrole-700">{formatFcfa(payment.amount)}</span>
      </div>
    </div>
  );
}
