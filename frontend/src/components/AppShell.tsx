"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const BASE_NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/properties", label: "Propriétés" },
  { href: "/tenants", label: "Locataires" },
  { href: "/payments", label: "Paiements" },
  { href: "/expenses", label: "Dépenses" },
  { href: "/contracts", label: "Contrats" },
  { href: "/issues", label: "Signalements" },
  { href: "/messages", label: "Messages" },
  { href: "/reports", label: "Rapports" },
];

const ADMIN_NAV = [{ href: "/admin", label: "Administration" }];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role === "TENANT") router.replace("/mon-espace");
  }, [loading, user, router]);

  if (loading || !user || user.role === "TENANT") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fond">
        <p className="text-sm text-petrole-600">Chargement…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-fond">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-petrole-800 text-petrole-50">
        <div className="flex items-center gap-2 px-5 py-6">
          <Image src="/logo.png" alt="HaBiTa" width={32} height={32} />
          <span className="font-display text-lg">HaBiTa</span>
        </div>

        <nav className="flex-1 px-3">
          {[...BASE_NAV, ...(user.role === "ADMIN" ? ADMIN_NAV : [])].map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 block px-3 py-2 text-sm transition ${
                  active ? "bg-petrole-700 text-white" : "text-petrole-200 hover:bg-petrole-700/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-petrole-700 px-5 py-4">
          <Link href="/profile" className="block truncate text-sm text-petrole-100 hover:underline">
            {user.name}
          </Link>
          <p className="mb-3 truncate text-xs text-petrole-300">{user.email}</p>
          <div className="flex gap-3">
            <Link href="/profile" className="text-xs text-petrole-200 underline">
              Mon profil
            </Link>
            <button onClick={logout} className="text-xs text-or-300 underline">
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
