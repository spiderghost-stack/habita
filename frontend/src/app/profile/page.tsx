"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TenantShell } from "@/components/TenantShell";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const Shell = user?.role === "TENANT" ? TenantShell : AppShell;

  if (!user) {
    return (
      <AppShell>
        <p className="text-sm text-petrole-500">Chargement…</p>
      </AppShell>
    );
  }

  return (
    <Shell>
      <h1 className="mb-6 font-display text-xl font-bold text-petrole-800 sm:text-2xl">Mon profil</h1>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <IdentitySection name={user.name} phone={user.phone ?? ""} onSave={updateProfile} />
        <PasswordSection onSave={updateProfile} />
        {user.role === "OWNER" && user.plan && <PlanSection plan={user.plan} />}
      </div>
    </Shell>
  );
}

const PLAN_LABEL: Record<string, string> = { FREE: "Gratuit", STARTER: "Starter", PRO: "Pro", BUSINESS: "Business" };
const PLAN_UNITS: Record<string, string> = { FREE: "1 propriété, 2 unités", STARTER: "jusqu'à 10 unités", PRO: "jusqu'à 50 unités, contrats, dépenses, rapports, score de gestion", BUSINESS: "illimité, gestion multi-propriétaires" };

function PlanSection({ plan }: { plan: string }) {
  return (
    <div className="border border-petrole-200 bg-white p-4 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-petrole-800">Mon plan</h2>
      <p className="mb-1 font-display text-xl font-bold text-petrole-800 sm:text-2xl">{PLAN_LABEL[plan] ?? plan}</p>
      <p className="mb-4 text-sm text-petrole-500">{PLAN_UNITS[plan]}</p>
      <p className="text-xs text-petrole-400">
        Aucun prestataire de paiement récurrent n'est encore branché — le changement de plan se fait pour
        l'instant manuellement par un administrateur. Contactez le support pour changer de plan.
      </p>
    </div>
  );
}

function IdentitySection({
  name,
  phone,
  onSave,
}: {
  name: string;
  phone: string;
  onSave: (input: { name?: string; phone?: string }) => Promise<void>;
}) {
  const [nameValue, setNameValue] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await onSave({ name: nameValue, phone: phoneValue });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour le profil.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-petrole-200 bg-white p-4 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-petrole-800">Identité</h2>

      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      {success && <p className="mb-4 border-l-2 border-petrole-500 bg-petrole-50 px-3 py-2 text-sm">Profil mis à jour.</p>}

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Nom complet</label>
      <input
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
        className="mb-4 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
      />

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Téléphone</label>
      <input
        value={phoneValue}
        onChange={(e) => setPhoneValue(e.target.value)}
        className="mb-6 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-petrole-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

function PasswordSection({
  onSave,
}: {
  onSave: (input: { currentPassword?: string; newPassword?: string }) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await onSave({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de changer le mot de passe.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-petrole-200 bg-white p-4 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-bold text-petrole-800">Mot de passe</h2>

      {error && <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm">{error}</p>}
      {success && <p className="mb-4 border-l-2 border-petrole-500 bg-petrole-50 px-3 py-2 text-sm">Mot de passe mis à jour.</p>}

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Mot de passe actuel</label>
      <input
        type="password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="mb-4 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
      />

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Nouveau mot de passe</label>
      <input
        type="password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="mb-6 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-petrole-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrole-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Changement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
