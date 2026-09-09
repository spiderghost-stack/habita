"use client";

import { ReactNode, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function TenantShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    else if (!loading && user && user.role !== "TENANT") router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-fond">
        <p className="text-sm font-medium text-petrole-600">Chargement…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-fond">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-petrole-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="HaBiTa" width={28} height={28} />
          <span className="font-display text-base font-bold text-petrole-800 sm:text-lg">HaBiTa</span>
        </div>
        <div className="flex items-center gap-3 text-sm sm:gap-4">
          <Link
            href="/profile"
            className="max-w-[120px] truncate font-medium text-petrole-600 underline sm:max-w-none"
          >
            {user.name}
          </Link>
          <button onClick={logout} className="font-semibold text-or-600 underline">
            Déconnexion
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
