"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, phone || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fond px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.png" alt="HaBiTa" width={72} height={72} priority />
        </div>

        <form onSubmit={handleSubmit} className="border border-petrole-200 bg-white p-6">
          <h1 className="mb-6 font-display text-xl text-petrole-800">Créer un compte propriétaire</h1>

          {error && (
            <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm text-petrole-800">{error}</p>
          )}

          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Nom complet</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />

          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />

          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Téléphone (optionnel)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mb-4 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />

          <label className="mb-1 block text-xs uppercase tracking-wide text-petrole-500">Mot de passe</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-petrole-700 py-2 text-sm font-medium text-white transition hover:bg-petrole-800 disabled:opacity-60"
          >
            {submitting ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-petrole-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-or-500 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
