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
        <p className="text-sm text-petrole-600">Chargement…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-fond">
      <header className="flex items-center justify-between border-b border-petrole-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="HaBiTa" width={28} height={28} />
          <span className="font-display text-lg text-petrole-800">HaBiTa</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/profile" className="text-petrole-600 underline">
            {user.name}
          </Link>
          <button onClick={logout} className="text-or-600 underline">
            Se déconnecter
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-6 py-8">{children}</div>
    </div>
  );
}
