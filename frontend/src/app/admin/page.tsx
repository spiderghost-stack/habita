"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import { AdminUser } from "@/lib/types";

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  OWNER: "Propriétaire",
  MANAGER: "Gestionnaire",
  ADMIN: "Administrateur",
  TENANT: "Locataire",
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    return api.get<AdminUser[]>("/admin/users").then(setUsers);
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger les utilisateurs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <h1 className="mb-2 font-display text-xl font-bold text-petrole-800 sm:text-2xl">Administration</h1>
      <p className="mb-8 text-sm text-petrole-500">
        Changement de rôle et de plan manuel — il n'y a pas de prestataire de paiement branché dans ce MVP, voir MANUAL_STEPS.md.
      </p>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && (
        <div className="overflow-x-auto border border-petrole-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-petrole-200 text-xs uppercase tracking-wide text-petrole-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Propriétés</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} onChanged={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function UserRow({ user, onChanged }: { user: AdminUser; onChanged: () => void }) {
  const [role, setRole] = useState(user.role);
  const [plan, setPlan] = useState(user.plan);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleChange(field: "role" | "plan", value: string) {
    setError(null);
    setSaving(true);
    try {
      await api.patch(`/admin/users/${user.id}`, { [field]: value });
      if (field === "role") setRole(value as AdminUser["role"]);
      else setPlan(value as AdminUser["plan"]);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour cet utilisateur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-petrole-100 last:border-b-0">
      <td className="px-4 py-3 text-petrole-800">{user.name}</td>
      <td className="px-4 py-3 text-petrole-600">{user.email}</td>
      <td className="px-4 py-3">
        <select
          value={role}
          disabled={saving}
          onChange={(e) => handleChange("role", e.target.value)}
          className="border border-petrole-200 px-2 py-1 text-sm outline-none focus:border-petrole-500"
        >
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={plan}
          disabled={saving}
          onChange={(e) => handleChange("plan", e.target.value)}
          className="border border-petrole-200 px-2 py-1 text-sm outline-none focus:border-petrole-500"
        >
          <option value="FREE">Gratuit</option>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="BUSINESS">Business</option>
        </select>
      </td>
      <td className="px-4 py-3 text-petrole-600">
        {user._count.properties}
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </td>
    </tr>
  );
}
