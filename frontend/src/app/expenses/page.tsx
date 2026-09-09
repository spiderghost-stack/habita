"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { Expense, Property } from "@/lib/types";
import { formatFcfa } from "@/lib/format";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    return api.get<Expense[]>("/expenses").then(setExpenses);
  }

  useEffect(() => {
    Promise.all([refresh(), api.get<Property[]>("/properties").then(setProperties)])
      .catch(() => setError("Impossible de charger les dépenses."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-petrole-800">Dépenses</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800"
        >
          {showForm ? "Annuler" : "Enregistrer une dépense"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {showForm && (
        <ExpenseForm
          properties={properties}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && expenses.length === 0 && (
        <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
          Aucune dépense enregistrée pour l'instant.
        </p>
      )}

      <div className="border border-petrole-200 bg-white">
        {expenses.map((e) => (
          <div key={e.id} className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0">
            <div>
              <p className="text-petrole-800">{e.label} · {e.property?.name}</p>
              <p className="text-xs text-petrole-500">
                {new Date(e.expenseDate).toLocaleDateString("fr-FR")}
                {e.category ? ` · ${e.category}` : ""}
                {e.comment ? ` · ${e.comment}` : ""}
              </p>
            </div>
            <span className="text-or-600">{formatFcfa(e.amount)}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function ExpenseForm({ properties, onCreated }: { properties: Property[]; onCreated: () => void }) {
  const [propertyId, setPropertyId] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/expenses", {
        propertyId,
        label,
        amount: Number(amount),
        category: category || undefined,
        comment: comment || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer cette dépense.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 border border-petrole-200 bg-white p-5">
      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Propriété</label>
          <select
            required
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          >
            <option value="">Sélectionner…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Libellé</label>
          <input
            required
            placeholder="Réparation plomberie"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Montant (FCFA)</label>
          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Catégorie (optionnel)</label>
          <input
            placeholder="Entretien, électricité…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Commentaire (optionnel)</label>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800 disabled:opacity-60"
      >
        {submitting ? "Enregistrement…" : "Enregistrer la dépense"}
      </button>
    </form>
  );
}
