"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fond px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.png" alt="HaBiTa" width={72} height={72} priority />
          <p className="mt-2 text-center text-sm text-petrole-500">
            Gérez vos maisons, vos locataires et vos loyers depuis un seul endroit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-petrole-200 bg-white p-6">
          <h1 className="mb-6 font-display text-xl font-bold text-petrole-800">Connexion</h1>

          {error && (
            <p className="mb-4 border-l-2 border-or-400 bg-or-50 px-3 py-2 text-sm text-petrole-800">{error}</p>
          )}

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full border border-petrole-200 px-3 py-2 text-sm outline-none focus:border-petrole-500"
            placeholder="vous@exemple.com"
          />

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-petrole-500">Mot de passe</label>
          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-petrole-200 py-2 pl-3 pr-10 text-sm outline-none focus:border-petrole-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-petrole-500 hover:text-petrole-700 focus:outline-none"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-petrole-700 py-2.5 text-sm font-semibold text-white transition hover:bg-petrole-800 disabled:opacity-60"
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-petrole-600">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-or-500 underline">
            Créer un compte propriétaire
          </Link>
        </p>
      </div>
    </main>
  );
}
