"use client";

import { Suspense, FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { Property, Unit } from "@/lib/types";

function NewTenantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState(searchParams.get("propertyId") || "");
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitId, setUnitId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Property[]>("/properties").then(setProperties);
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    api.get<Property>(`/properties/${propertyId}`).then((p) => {
      setUnits((p.units ?? []).filter((u) => u.status === "AVAILABLE"));
    });
  }, [propertyId]);

  useEffect(() => {
    const unit = units.find((u) => u.id === unitId);
    if (unit) setRentAmount(unit.rentAmount);
  }, [unitId, units]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tenant = await api.post<{ id: string }>("/tenants", {
        propertyId,
        unitId: unitId || undefined,
        firstName,
        lastName,
        phone,
        email: email || undefined,
        rentAmount: Number(rentAmount),
        dueDay: Number(dueDay),
      });
      router.push(`/tenants/${tenant.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter ce locataire.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl border border-petrole-200 bg-white p-6">
      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Propriété</label>
        <select
          required
          value={propertyId}
          onChange={(e) => { setPropertyId(e.target.value); setUnitId(""); }}
          className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        >
          <option value="">Sélectionner…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">
          Unité (optionnel)
        </label>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          disabled={!propertyId}
          className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500 disabled:bg-fond"
        >
          <option value="">Aucune unité assignée</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.identifier}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Prénom</label>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Nom</label>
          <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Téléphone</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Email (optionnel)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Loyer mensuel (FCFA)</label>
          <input required type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Jour d'échéance</label>
          <input required type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500" />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-petrole-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Ajout…" : "Ajouter le locataire"}
      </button>
    </form>
  );
}

export default function NewTenantPage() {
  return (
    <AppShell>
      <h1 className="mb-6 font-display text-xl font-bold text-petrole-800 sm:text-2xl">Ajouter un locataire</h1>
      <Suspense fallback={<div>Chargement...</div>}>
        <NewTenantForm />
      </Suspense>
    </AppShell>
  );
}
