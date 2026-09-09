"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError, downloadFile } from "@/lib/api";
import { Tenant, Payment } from "@/lib/types";
import { formatFcfa } from "@/lib/format";

const METHOD_LABEL: Record<Payment["method"], string> = {
  CASH: "Espèces",
  BANK_TRANSFER: "Virement",
  MOBILE_MONEY: "Mobile Money",
  CHECK: "Chèque",
  OTHER: "Autre",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movingOut, setMovingOut] = useState(false);

  function refresh() {
    return api.get<Tenant>(`/tenants/${params.id}`).then(setTenant);
  }

  useEffect(() => {
    refresh().catch(() => setError("Impossible de charger ce locataire."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleMoveOut() {
    if (!tenant) return;
    const confirmed = window.confirm(
      `Marquer le départ de ${tenant.firstName} ${tenant.lastName} ? Son historique de paiement est conservé, mais son unité redevient disponible et il disparaît des listes actives.`
    );
    if (!confirmed) return;

    setMovingOut(true);
    try {
      await api.post(`/tenants/${tenant.id}/move-out`);
      router.push("/tenants");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer le départ.");
      setMovingOut(false);
    }
  }

  if (error) return <AppShell><p className="text-sm text-red-700">{error}</p></AppShell>;
  if (!tenant) return <AppShell><p className="text-sm text-petrole-500">Chargement…</p></AppShell>;

  return (
    <AppShell>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-petrole-800">{tenant.firstName} {tenant.lastName}</h1>
          <p className="text-sm text-petrole-500">{tenant.unit?.identifier ?? "Unité non assignée"} · {tenant.phone}</p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={tenant.status} />
          <div className="flex gap-3 text-sm">
            <button onClick={() => setShowEditForm((s) => !s)} className="text-or-600 underline">
              {showEditForm ? "Annuler" : "Modifier"}
            </button>
            <button onClick={handleMoveOut} disabled={movingOut} className="text-red-700 underline disabled:opacity-60">
              {movingOut ? "…" : "Marquer le départ"}
            </button>
          </div>
        </div>
      </div>

      {showEditForm && (
        <TenantEditForm
          tenant={tenant}
          onSaved={() => {
            setShowEditForm(false);
            refresh();
          }}
        />
      )}

      <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden border border-petrole-200 bg-petrole-200">
        <div className="bg-white px-4 py-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-petrole-500">Loyer</p>
          <p className="font-display text-lg text-petrole-800">{formatFcfa(tenant.rentAmount)}</p>
        </div>
        <div className="bg-white px-4 py-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-petrole-500">Échéance</p>
          <p className="font-display text-lg text-petrole-800">Le {tenant.dueDay} de chaque mois</p>
        </div>
        <div className="bg-white px-4 py-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-petrole-500">Email</p>
          <p className="font-display text-lg text-petrole-800">{tenant.email || "—"}</p>
        </div>
      </div>

      <PortalAccessSection tenant={tenant} />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg text-petrole-800">Historique des paiements</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm text-or-600 underline">
          {showForm ? "Annuler" : "Enregistrer un paiement"}
        </button>
      </div>

      {showForm && (
        <PaymentForm
          tenantId={tenant.id}
          defaultAmount={tenant.rentAmount}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      <div className="border border-petrole-200 bg-white">
        {(tenant.payments ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-petrole-500">Aucun paiement enregistré pour l'instant.</p>
        )}
        {(tenant.payments ?? []).map((p) => (
          <PaymentRow key={p.id} payment={p} />
        ))}
      </div>
    </AppShell>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      await downloadFile(`/payments/${payment.id}/receipt.pdf`, `recu-${payment.receiptNumber}.pdf`);
    } catch {
      setError("Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0">
      <div>
        <p className="text-petrole-800">{payment.period}</p>
        <p className="text-xs text-petrole-500">
          {new Date(payment.paymentDate).toLocaleDateString("fr-FR")} · {METHOD_LABEL[payment.method]} · reçu {payment.receiptNumber}
        </p>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleDownload} disabled={downloading} className="text-xs text-or-600 underline disabled:opacity-60">
          {downloading ? "…" : "Reçu PDF"}
        </button>
        <span className="text-petrole-700">{formatFcfa(payment.amount)}</span>
      </div>
    </div>
  );
}

function PortalAccessSection({ tenant }: { tenant: Tenant }) {
  const [credentials, setCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateOrReset() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post<{ email: string; temporaryPassword: string }>(`/tenants/${tenant.id}/portal-access`);
      setCredentials(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de créer l'accès à l'espace locataire.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-8 border border-petrole-200 bg-white p-5">
      <h2 className="mb-2 font-display text-lg text-petrole-800">Espace locataire</h2>

      {!tenant.email && (
        <p className="text-sm text-petrole-500">
          Ajoutez une adresse email à ce locataire (bouton Modifier ci-dessus) pour pouvoir lui créer un accès.
        </p>
      )}

      {tenant.email && !credentials && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-petrole-500">
            {tenant.userId
              ? "Ce locataire a déjà un accès à son espace personnel."
              : "Ce locataire n'a pas encore d'accès à son espace personnel."}
          </p>
          <button
            onClick={handleCreateOrReset}
            disabled={submitting}
            className="text-sm text-or-600 underline disabled:opacity-60"
          >
            {submitting ? "…" : tenant.userId ? "Réinitialiser le mot de passe" : "Créer l'accès"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}

      {credentials && (
        <div className="border-l-2 border-petrole-500 bg-petrole-50 px-4 py-3 text-sm">
          <p className="mb-1 text-petrole-800">
            Identifiants à transmettre vous-même à {tenant.firstName} — ils ne seront plus affichés après avoir quitté cette page :
          </p>
          <p className="text-petrole-700">Email : <span className="font-mono">{credentials.email}</span></p>
          <p className="text-petrole-700">Mot de passe temporaire : <span className="font-mono">{credentials.temporaryPassword}</span></p>
        </div>
      )}
    </div>
  );
}

function TenantEditForm({ tenant, onSaved }: { tenant: Tenant; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(tenant.firstName);
  const [lastName, setLastName] = useState(tenant.lastName);
  const [phone, setPhone] = useState(tenant.phone);
  const [email, setEmail] = useState(tenant.email ?? "");
  const [rentAmount, setRentAmount] = useState(tenant.rentAmount);
  const [dueDay, setDueDay] = useState(String(tenant.dueDay));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.patch(`/tenants/${tenant.id}`, {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        rentAmount: Number(rentAmount),
        dueDay: Number(dueDay),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour ce locataire.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-petrole-200 bg-white p-5">
      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Prénom</label>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Nom</label>
          <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Téléphone</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Email (optionnel)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Loyer mensuel (FCFA)</label>
          <input required type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Jour d'échéance</label>
          <input required type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
      >
        {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}

function PaymentForm({
  tenantId,
  defaultAmount,
  onCreated,
}: {
  tenantId: string;
  defaultAmount: string;
  onCreated: () => void;
}) {
  const [amount, setAmount] = useState(defaultAmount);
  const [period, setPeriod] = useState(currentPeriod());
  const [method, setMethod] = useState<Payment["method"]>("CASH");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/payments", { tenantId, amount: Number(amount), period, method, comment: comment || undefined });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ce paiement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 border border-petrole-200 bg-white p-4">
      {error && <p className="mb-3 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input
          required
          type="number"
          placeholder="Montant"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
        <input
          required
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as Payment["method"])}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        >
          {Object.entries(METHOD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          placeholder="Commentaire (optionnel)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-3 bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
      >
        {submitting ? "Enregistrement…" : "Enregistrer le paiement"}
      </button>
    </form>
  );
}
