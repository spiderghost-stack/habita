"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else {
      router.replace(user.role === "TENANT" ? "/mon-espace" : "/dashboard");
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-fond">
      <p className="font-body text-sm text-petrole-600">Chargement de HaBiTa…</p>
    </main>
  );
}
