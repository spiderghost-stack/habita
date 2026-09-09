"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ConfirmModal } from "@/components/ConfirmModal";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Property, Unit, ManagementScore } from "@/lib/types";
import { formatFcfa } from "@/lib/format";

const UNIT_STATUS_LABEL: Record<Unit["status"], string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Occupée",
  MAINTENANCE: "En maintenance",
};

export default function PropertyDetailPage() {
  const { user } = useAuth();
  const canManageProperty = user?.role === "OWNER" || user?.role === "ADMIN";
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function refresh() {
    return api.get<Property>(`/properties/${params.id}`).then(setProperty);
  }

  useEffect(() => {
    refresh().catch(() => setError("Impossible de charger cette propriété."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDeleteProperty() {
    if (!property) return;
    const hasUnits = (property.units ?? []).length > 0;
    const hasTenants = (property.tenants ?? []).length > 0;
    const warning = hasUnits || hasTenants
      ? `Supprimer "${property.name}" effacera aussi ses ${property.units?.length ?? 0} unité(s) et l'historique de paiement de ses ${property.tenants?.length ?? 0} locataire(s). Cette action est irréversible. Continuer ?`
      : `Supprimer "${property.name}" ? Cette action est irréversible.`;

    setConfirmDelete(false);

    setDeleting(true);
    try {
      await api.delete(`/properties/${property.id}`);
      router.push("/properties");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de supprimer cette propriété.");
      setDeleting(false);
    }
  }

  if (error) return <AppShell><p className="text-sm text-red-700">{error}</p></AppShell>;
  if (!property) return <AppShell><p className="text-sm text-petrole-500">Chargement…</p></AppShell>;

  return (
    <AppShell>
      <Link href="/properties" className="mb-4 inline-block text-xs text-petrole-500 underline">
        ← Toutes les propriétés
      </Link>

      <div className="mb-2 flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-petrole-800 sm:text-2xl">{property.name}</h1>
          <p className="text-sm text-petrole-500">{property.address}</p>
        </div>
        <div className="flex gap-3 text-sm">
          {canManageProperty && (
            <>
              <button onClick={() => setShowEditForm((s) => !s)} className="text-or-600 underline">
                {showEditForm ? "Annuler" : "Modifier"}
              </button>
              <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="text-red-700 underline disabled:opacity-60">
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Supprimer la propriété ?"
        description={
          (property.units ?? []).length > 0 || (property.tenants ?? []).length > 0
            ? `Supprimer "${property.name}" effacera aussi ses ${property.units?.length ?? 0} unité(s) et l'historique de paiement de ses ${property.tenants?.length ?? 0} locataire(s). Cette action est irréversible. Continuer ?`
            : `Supprimer "${property.name}" ? Cette action est irréversible.`
        }
        confirmLabel="Supprimer"
        onConfirm={handleDeleteProperty}
        onCancel={() => setConfirmDelete(false)}
      />

      {showEditForm && canManageProperty && (
        <PropertyEditForm
          property={property}
          onSaved={() => {
            setShowEditForm(false);
            refresh();
          }}
        />
      )}

      {canManageProperty && <ManagersSection property={property} onChanged={refresh} />}

      <ScoreSection propertyId={property.id} />

      <div className="mb-10" />

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-petrole-800">Unités</h2>
          <button onClick={() => setShowUnitForm((s) => !s)} className="text-sm text-or-600 underline">
            {showUnitForm ? "Annuler" : "+ Ajouter une unité"}
          </button>
        </div>

        {showUnitForm && (
          <UnitForm
            propertyId={property.id}
            onCreated={() => {
              setShowUnitForm(false);
              refresh();
            }}
          />
        )}

        <div className="border border-petrole-200 bg-white">
          {(property.units ?? []).length === 0 && (
            <p className="px-4 py-6 text-sm text-petrole-500">Aucune unité pour l'instant.</p>
          )}
          {(property.units ?? []).map((u) => (
            <UnitRow key={u.id} unit={u} onChanged={refresh} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-petrole-800">Locataires</h2>
          <Link href={`/tenants/new?propertyId=${property.id}`} className="text-sm text-or-600 underline">
            + Ajouter un locataire
          </Link>
        </div>

        <div className="border border-petrole-200 bg-white">
          {(property.tenants ?? []).length === 0 && (
            <p className="px-4 py-6 text-sm text-petrole-500">Aucun locataire pour l'instant.</p>
          )}
          {(property.tenants ?? []).map((t) => (
            <Link
              key={t.id}
              href={`/tenants/${t.id}`}
              className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0 hover:bg-fond"
            >
              <p className="text-petrole-800">{t.firstName} {t.lastName}</p>
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function ManagersSection({ property, onChanged }: { property: Property; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; temporaryPassword?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post<{ manager: { email: string }; temporaryPassword?: string }>(
        `/properties/${property.id}/managers`,
        { email }
      );
      setCredentials({ email: result.manager.email, temporaryPassword: result.temporaryPassword });
      setEmail("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'assigner ce gestionnaire.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(managerId: string) {
    setConfirmRemove(null);
    try {
      await api.delete(`/properties/${property.id}/managers/${managerId}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de retirer ce gestionnaire.");
    }
  }

  return (
    <div className="mb-6 border border-petrole-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-petrole-800">Gestionnaires</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm text-or-600 underline">
          {showForm ? "Annuler" : "+ Assigner un gestionnaire"}
        </button>
      </div>

      {(property.managers ?? []).length === 0 ? (
        <p className="text-sm text-petrole-500">Aucun gestionnaire assigné — vous gérez seul cette propriété.</p>
      ) : (
        <ul className="mb-2 text-sm">
          {property.managers!.map((m) => (
            <li key={m.id} className="flex items-center justify-between border-b border-petrole-100 py-2 last:border-b-0">
              <span className="text-petrole-800">{m.manager.name} · {m.manager.email}</span>
              <button onClick={() => setConfirmRemove(m.managerId)} className="text-xs text-red-700 underline">
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleAssign} className="mt-3 flex gap-3">
          <input
            required
            type="email"
            placeholder="email du gestionnaire"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full shrink-0 bg-petrole-700 px-4 py-2 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "…" : "Assigner"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}

      {credentials && (
        <div className="mt-3 border-l-2 border-petrole-500 bg-petrole-50 px-4 py-3 text-sm">
          {credentials.temporaryPassword ? (
            <>
              <p className="mb-1 text-petrole-800">
                Nouveau compte gestionnaire créé — identifiants à transmettre vous-même, ils ne seront plus
                affichés après avoir quitté cette page :
              </p>
              <p className="text-petrole-700">Email : <span className="font-mono">{credentials.email}</span></p>
              <p className="text-petrole-700">Mot de passe temporaire : <span className="font-mono">{credentials.temporaryPassword}</span></p>
            </>
          ) : (
            <p className="text-petrole-800">
              {credentials.email} avait déjà un compte gestionnaire — il a maintenant accès à cette propriété.
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmRemove !== null}
        title="Retirer le gestionnaire ?"
        description="Voulez-vous retirer l'accès de ce gestionnaire à cette propriété ?"
        confirmLabel="Retirer"
        onConfirm={() => {
          if (confirmRemove) handleRemove(confirmRemove);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}

function PropertyEditForm({ property, onSaved }: { property: Property; onSaved: () => void }) {
  const [name, setName] = useState(property.name);
  const [address, setAddress] = useState(property.address);
  const [description, setDescription] = useState(property.description ?? "");
  const [potentialIncome, setPotentialIncome] = useState(property.potentialIncome ?? "");
  const [status, setStatus] = useState(property.status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.patch(`/properties/${property.id}`, {
        name,
        address,
        description: description || undefined,
        potentialIncome: potentialIncome ? Number(potentialIncome) : undefined,
        status,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour la propriété.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-petrole-200 bg-white p-5">
      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nom" value={name} onChange={setName} required />
        <Field label="Adresse" value={address} onChange={setAddress} required />
        <Field
          label="Revenu potentiel mensuel (FCFA)"
          value={String(potentialIncome)}
          onChange={setPotentialIncome}
          type="number"
        />
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Property["status"])}
            className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archivée</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Field label="Description" value={description} onChange={setDescription} />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full bg-petrole-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}

function UnitRow({ unit, onChanged }: { unit: Unit; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [identifier, setIdentifier] = useState(unit.identifier);
  const [type, setType] = useState(unit.type ?? "");
  const [rentAmount, setRentAmount] = useState(unit.rentAmount);
  const [status, setStatus] = useState(unit.status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.patch(`/units/${unit.id}`, { identifier, type: type || undefined, rentAmount: Number(rentAmount), status });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de modifier cette unité.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setConfirmDelete(false);
    try {
      await api.delete(`/units/${unit.id}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de supprimer cette unité.");
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="border-b border-petrole-100 px-4 py-3 last:border-b-0">
        {error && <p className="mb-2 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-xs">{error}</p>}
        <div className="mb-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="border border-petrole-200 px-2 py-1 text-sm outline-none focus:border-petrole-500" />
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type" className="border border-petrole-200 px-2 py-1 text-sm outline-none focus:border-petrole-500" />
          <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="border border-petrole-200 px-2 py-1 text-sm outline-none focus:border-petrole-500" />
          <select value={status} onChange={(e) => setStatus(e.target.value as Unit["status"])} className="border border-petrole-200 px-2 py-1 text-sm outline-none focus:border-petrole-500">
            <option value="AVAILABLE">Disponible</option>
            <option value="OCCUPIED">Occupée</option>
            <option value="MAINTENANCE">En maintenance</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="bg-petrole-700 px-3 py-1 text-xs text-white hover:bg-petrole-800 disabled:opacity-60">
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-petrole-500 underline">
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0">
      <div>
        <p className="text-petrole-800">{unit.identifier}</p>
        <p className="text-xs text-petrole-500">{unit.type || "—"} · {formatFcfa(unit.rentAmount)}/mois</p>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-petrole-500">{UNIT_STATUS_LABEL[unit.status]}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-or-600 underline">Modifier</button>
        <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-700 underline">Supprimer</button>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Supprimer l'unité ?"
        description={`Supprimer l'unité "${unit.identifier}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function UnitForm({ propertyId, onCreated }: { propertyId: string; onCreated: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/units", { propertyId, identifier, type: type || undefined, rentAmount: Number(rentAmount) });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter l'unité.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 border border-petrole-200 bg-white p-4">
      {error && <p className="mb-3 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          required
          placeholder="Identifiant (ex: Appartement A)"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
        <input
          placeholder="Type (optionnel)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
        <input
          required
          type="number"
          placeholder="Loyer mensuel (FCFA)"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
          className="border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-3 w-full bg-petrole-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Ajout…" : "Ajouter l'unité"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
      />
    </div>
  );
}

function ScoreSection({ propertyId }: { propertyId: string }) {
  const [score, setScore] = useState<ManagementScore | null>(null);
  const [locked, setLocked] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ManagementScore>(`/score/${propertyId}`)
      .then(setScore)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) setLocked(err.message);
      });
  }, [propertyId]);

  if (locked) {
    return (
      <div className="mb-6 border border-petrole-200 bg-white p-5">
        <h2 className="mb-1 font-display text-lg font-bold text-petrole-800">Score de gestion</h2>
        <p className="text-sm text-petrole-500">{locked}</p>
      </div>
    );
  }

  if (!score) return null;

  return (
    <div className="mb-6 border border-petrole-200 bg-white p-5">
      <h2 className="mb-3 font-display text-lg font-bold text-petrole-800">Score de gestion</h2>
      <p className="mb-3 font-display text-3xl font-bold text-petrole-800">{score.score} / 100</p>
      <div className="grid grid-cols-2 gap-2 text-xs text-petrole-500 md:grid-cols-5">
        <span>Paiements : {score.breakdown.paymentRate}%</span>
        <span>Occupation : {score.breakdown.occupancyRate}%</span>
        <span>Sans retard : {score.breakdown.lateFreeRate}%</span>
        <span>Sans signalement : {score.breakdown.issueFreeScore}%</span>
        <span>Dépenses maîtrisées : {score.breakdown.expenseControlScore}%</span>
      </div>
    </div>
  );
}
