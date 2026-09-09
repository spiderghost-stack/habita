"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { subscribeToPushNotifications } from "@/lib/push";
import { ConfirmModal } from "@/components/ConfirmModal";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Ferme la sidebar si on change de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role === "TENANT") router.replace("/mon-espace");
    
    // Demander/Activer les notifications push si l'utilisateur est connecté
    if (!loading && user && user.role !== "TENANT") {
      subscribeToPushNotifications();
    }
  }, [loading, user, router]);

  if (loading || !user || user.role === "TENANT") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fond">
        <p className="text-sm font-medium text-petrole-600">Chargement…</p>
      </main>
    );
  }

  const navItems = [...BASE_NAV, ...(user.role === "ADMIN" ? ADMIN_NAV : [])];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <Image src="/logo.png" alt="HaBiTa" width={32} height={32} />
        <span className="font-display text-lg font-bold text-white">HaBiTa</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-petrole-700 text-white"
                  : "text-petrole-200 hover:bg-petrole-700/60 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profil */}
      <div className="border-t border-petrole-700 px-5 py-4">
        <Link
          href="/profile"
          className="block truncate text-sm font-semibold text-petrole-100 hover:underline"
        >
          {user.name}
        </Link>
        <p className="mb-3 truncate text-xs text-petrole-300">{user.email}</p>
        <div className="flex gap-3">
          <Link href="/profile" className="text-xs font-medium text-petrole-200 underline">
            Mon profil
          </Link>
          <button onClick={() => setConfirmLogout(true)} className="text-xs font-medium text-or-300 underline">
            Se déconnecter
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmLogout}
        title="Se déconnecter ?"
        description="Voulez-vous vraiment vous déconnecter de votre compte ?"
        confirmLabel="Déconnexion"
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );

  return (
    <div className="flex min-h-screen bg-fond">
      {/* ── Sidebar desktop (lg+) ── */}
      <aside className="hidden w-60 flex-shrink-0 flex-col bg-petrole-800 text-petrole-50 lg:flex">
        <SidebarContent />
      </aside>

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar drawer mobile ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-petrole-800 text-petrole-50 transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-4 top-5 text-petrole-200 hover:text-white"
          aria-label="Fermer le menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent />
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile uniquement */}
        <header className="flex items-center justify-between border-b border-petrole-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="HaBiTa" width={28} height={28} />
            <span className="font-display text-base font-bold text-petrole-800">HaBiTa</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-2 text-petrole-700 hover:bg-petrole-50"
            aria-label="Ouvrir le menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Contenu de la page */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
