"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConfirmModal } from "@/components/ConfirmModal";
import { api, ApiError } from "@/lib/api";
import { Contract, Tenant } from "@/lib/types";
import { formatFcfa } from "@/lib/format";

const STATUS_LABEL: Record<Contract["status"], string> = {
  ACTIVE: "Actif",
  TERMINATED: "Résilié",
  EXPIRED: "Expiré",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    return api.get<Contract[]>("/contracts").then(setContracts);
  }

  useEffect(() => {
    Promise.all([refresh(), api.get<Tenant[]>("/tenants").then(setTenants)])
      .catch(() => setError("Impossible de charger les contrats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-petrole-800 sm:text-2xl">Contrats</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800"
        >
          {showForm ? "Annuler" : "Nouveau contrat"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {showForm && (
        <ContractForm
          tenants={tenants}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && contracts.length === 0 && (
        <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
          Aucun contrat pour l'instant.
        </p>
      )}

      <div className="border border-petrole-200 bg-white">
        {contracts.map((c) => (
          <ContractRow key={c.id} contract={c} onChanged={refresh} />
        ))}
      </div>
    </AppShell>
  );
}

function ContractRow({ contract, onChanged }: { contract: Contract; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(false);

  async function handleRenew() {
    const input = window.prompt("Nouvelle date de fin (AAAA-MM-JJ) :");
    if (!input) return;
    const newEndDate = new Date(input);
    if (Number.isNaN(newEndDate.getTime())) {
      setError("Date invalide.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/contracts/${contract.id}/renew`, { newEndDate: newEndDate.toISOString() });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de renouveler ce contrat.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTerminate() {
    setConfirmTerminate(false);
    setBusy(true);
    try {
      await api.post(`/contracts/${contract.id}/terminate`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de résilier ce contrat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-petrole-800">
            {contract.tenant?.firstName} {contract.tenant?.lastName} · {contract.property?.name}
          </p>
          <p className="text-xs text-petrole-500">
            Du {new Date(contract.startDate).toLocaleDateString("fr-FR")} au{" "}
            {new Date(contract.endDate).toLocaleDateString("fr-FR")} · {formatFcfa(contract.rentAmount)}/mois
            {contract.deposit ? ` · caution ${formatFcfa(contract.deposit)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {contract.expiringSoon && (
            <span className="bg-or-100 px-2 py-0.5 text-xs text-or-600">
              Expire dans {contract.daysUntilExpiry} j
            </span>
          )}
          <span className="text-xs text-petrole-500">{STATUS_LABEL[contract.status]}</span>
          {contract.status === "ACTIVE" && (
            <>
              <button onClick={handleRenew} disabled={busy} className="text-xs text-or-600 underline disabled:opacity-60">
                Renouveler
              </button>
              <button onClick={() => setConfirmTerminate(true)} disabled={busy} className="text-xs text-red-700 underline disabled:opacity-60">
                Résilier
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}

      <ConfirmModal
        isOpen={confirmTerminate}
        title="Résilier ce contrat ?"
        description="Voulez-vous vraiment résilier ce contrat ?"
        confirmLabel="Résilier"
        onConfirm={handleTerminate}
        onCancel={() => setConfirmTerminate(false)}
      />
    </div>
  );
}

function ContractForm({ tenants, onCreated }: { tenants: Tenant[]; onCreated: () => void }) {
  const [tenantId, setTenantId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [conditions, setConditions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) setRentAmount(tenant.rentAmount);
  }, [tenantId, tenants]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/contracts", {
        tenantId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        rentAmount: Number(rentAmount),
        deposit: deposit ? Number(deposit) : undefined,
        conditions: conditions || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de créer ce contrat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 border border-petrole-200 bg-white p-5">
      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Locataire</label>
          <select
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          >
            <option value="">Sélectionner…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Date de début</label>
          <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Date de fin</label>
          <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Loyer mensuel (FCFA)</label>
          <input required type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Caution (optionnel)</label>
          <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Conditions (optionnel)</label>
          <input value={conditions} onChange={(e) => setConditions(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
      >
        {submitting ? "Création…" : "Créer le contrat"}
      </button>
    </form>
  );
}
