"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { Tenant } from "@/lib/types";
import { formatFcfa } from "@/lib/format";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Tenant[]>("/tenants")
      .then(setTenants)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-petrole-800">Locataires</h1>
        <Link href="/tenants/new" className="bg-petrole-700 px-4 py-2 text-sm text-white hover:bg-petrole-800">
          Ajouter un locataire
        </Link>
      </div>

      {loading && <p className="text-sm text-petrole-500">Chargement…</p>}

      {!loading && tenants.length === 0 && (
        <p className="border border-petrole-200 bg-white px-4 py-6 text-sm text-petrole-500">
          Aucun locataire pour l'instant.
        </p>
      )}

      <div className="border border-petrole-200 bg-white">
        {tenants.map((t) => (
          <Link
            key={t.id}
            href={`/tenants/${t.id}`}
            className="flex items-center justify-between border-b border-petrole-100 px-4 py-3 text-sm last:border-b-0 hover:bg-fond"
          >
            <div>
              <p className="text-petrole-800">{t.firstName} {t.lastName}</p>
              <p className="text-xs text-petrole-500">{t.unit?.identifier ?? "Unité non assignée"} · {formatFcfa(t.rentAmount)}/mois</p>
            </div>
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
