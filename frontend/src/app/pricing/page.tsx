"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, MessageCircle, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const WHATSAPP_NUMBER = "2290153079576";

const PLANS = [
  {
    id: "FREE",
    name: "Gratuit",
    priceEuro: "0",
    priceFcfa: "0",
    description: "Pour tester l'application avec un seul bien.",
    features: [
      { name: "1 Propriété", included: true },
      { name: "2 Unités (Chambres/Apparts)", included: true },
      { name: "Suivi des paiements", included: true },
      { name: "Gestion des contrats", included: false },
      { name: "Suivi des dépenses", included: false },
      { name: "Rapports financiers", included: false },
      { name: "Gestionnaires multiples", included: false },
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    priceEuro: "2,29",
    priceFcfa: "1 500",
    description: "Idéal pour les petits propriétaires.",
    features: [
      { name: "Propriétés illimitées", included: true },
      { name: "10 Unités", included: true },
      { name: "Suivi des paiements", included: true },
      { name: "Gestion des contrats", included: false },
      { name: "Suivi des dépenses", included: false },
      { name: "Rapports financiers", included: false },
      { name: "Gestionnaires multiples", included: false },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceEuro: "4,57",
    priceFcfa: "3 000",
    popular: true,
    description: "Pour une gestion locative sérieuse.",
    features: [
      { name: "Propriétés illimitées", included: true },
      { name: "50 Unités", included: true },
      { name: "Suivi des paiements", included: true },
      { name: "Gestion des contrats", included: true },
      { name: "Suivi des dépenses", included: true },
      { name: "Rapports financiers", included: true },
      { name: "Gestionnaires multiples", included: false },
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    priceEuro: "7,62",
    priceFcfa: "5 000",
    description: "Pour les agences et gros portefeuilles.",
    features: [
      { name: "Propriétés illimitées", included: true },
      { name: "Unités illimitées", included: true },
      { name: "Suivi des paiements", included: true },
      { name: "Gestion des contrats", included: true },
      { name: "Suivi des dépenses", included: true },
      { name: "Rapports financiers", included: true },
      { name: "Gestionnaires multiples", included: true },
    ],
  },
];

export default function PricingPage() {
  const { user, loading } = useAuth();

  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planName: string, planId: string) => {
    if (!user) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }
    setSubscribing(planId);
    setError(null);
    try {
      const { url } = await api.post<{ url: string }>("/billing/subscribe", { plan: planId });
      window.location.href = url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'initialisation du paiement.");
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-fond">
      {/* Navbar simplifiée */}
      <header className="bg-white border-b border-petrole-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-xl text-petrole-800">
            HaBiTa
          </Link>
          <div className="flex gap-4">
            {!loading && !user && (
              <>
                <Link href="/login" className="text-sm font-medium text-petrole-600 hover:text-petrole-800 flex items-center">
                  Se connecter
                </Link>
                <Link href="/register" className="bg-petrole-700 text-white px-4 py-2 text-sm font-medium hover:bg-petrole-800">
                  Créer un compte
                </Link>
              </>
            )}
            {!loading && user && (
              <Link href="/dashboard" className="bg-petrole-700 text-white px-4 py-2 text-sm font-medium hover:bg-petrole-800">
                Aller au tableau de bord
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-petrole-800 mb-4">
            Des tarifs simples et transparents
          </h1>
          <p className="text-lg text-petrole-600 mb-4">
            Choisissez le plan qui correspond à la taille de votre portefeuille immobilier. Sans engagement.
          </p>
          {error && <p className="text-red-700 bg-red-50 py-3 px-4 border border-red-200 inline-block rounded">{error}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white border ${
                plan.popular ? "border-or-500 shadow-md relative" : "border-petrole-200"
              } p-6 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-or-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Le plus populaire
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-petrole-800 mb-2">{plan.name}</h3>
              <p className="text-sm text-petrole-500 mb-6 h-10">{plan.description}</p>
              <div className="mb-6 border-b border-petrole-100 pb-6">
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display text-3xl font-bold text-petrole-800">{plan.priceEuro}€</span>
                  <span className="text-petrole-500 text-sm mb-1">/mois</span>
                </div>
                {plan.priceFcfa !== "0" && (
                  <p className="text-sm font-medium text-or-600">Soit {plan.priceFcfa} FCFA / mois</p>
                )}
                {plan.priceFcfa === "0" && (
                  <p className="text-sm font-medium text-petrole-500">Totalement gratuit</p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    {feat.included ? (
                      <Check className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-petrole-200 shrink-0" />
                    )}
                    <span className={feat.included ? "text-petrole-700 font-medium" : "text-petrole-400"}>
                      {feat.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              {plan.id === "FREE" ? (
                <Link
                  href={user ? "/dashboard" : "/register"}
                  className="w-full block text-center bg-petrole-50 text-petrole-700 border border-petrole-200 py-2.5 font-semibold hover:bg-petrole-100 transition-colors"
                >
                  {user ? "Plan actuel" : "Commencer gratuitement"}
                </Link>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.name, plan.id)}
                  disabled={subscribing === plan.id}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 font-semibold transition-colors disabled:opacity-60 ${
                    plan.popular
                      ? "bg-or-500 text-white hover:bg-or-600"
                      : "bg-petrole-700 text-white hover:bg-petrole-800"
                  }`}
                >
                  {subscribing === plan.id ? (
                    "Chargement..."
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      S'abonner
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
