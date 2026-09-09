"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Property } from "@/lib/types";
import { formatFcfa } from "@/lib/format";

export default function PropertiesPage() {
  const { user } = useAuth();
  const canCreate = user?.role !== "MANAGER";
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return api.get<Property[]>("/properties").then(setProperties);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-petrole-800 sm:text-2xl">Propriétés</h1>
        {canCreate && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800"
          >
            {showForm ? "Annuler" : "Ajouter une propriété"}
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <PropertyForm
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && properties.length === 0 && (
        <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
          {canCreate
            ? "Aucune propriété pour l'instant. Ajoutez la première ci-dessus."
            : "Aucune propriété ne vous a été assignée pour l'instant."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="block border border-petrole-200 bg-white p-4 hover:border-petrole-400 sm:p-5"
          >
            <h3 className="font-display text-base font-bold text-petrole-800 sm:text-lg">{p.name}</h3>
            <p className="mb-3 text-sm text-petrole-500">
              {p.address}
              {user?.role !== "OWNER" && p.owner && ` · propriétaire : ${p.owner.name}`}
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-petrole-600">
              <span>{p._count?.units ?? 0} unité(s)</span>
              <span>{p._count?.tenants ?? 0} locataire(s)</span>
              {p.potentialIncome && <span>Revenu potentiel : {formatFcfa(p.potentialIncome)}/mois</span>}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function PropertyForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [potentialIncome, setPotentialIncome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/properties", {
        name,
        address,
        description: description || undefined,
        potentialIncome: potentialIncome ? Number(potentialIncome) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter la propriété.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 border border-petrole-200 bg-white p-5">
      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nom" value={name} onChange={setName} required placeholder="Villa Agontikon" />
        <Field label="Adresse" value={address} onChange={setAddress} required placeholder="Cotonou" />
        <Field
          label="Revenu potentiel mensuel (FCFA)"
          value={potentialIncome}
          onChange={setPotentialIncome}
          type="number"
        />
        <Field label="Description" value={description} onChange={setDescription} />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
      >
        {submitting ? "Ajout…" : "Enregistrer"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
      />
    </div>
  );
}
