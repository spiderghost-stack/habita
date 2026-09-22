import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Découvrez les plans tarifaires de HaBiTa. Des offres adaptées à la taille de votre portefeuille immobilier, du gratuit au Business.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Tarifs | HaBiTa",
    description: "Découvrez les plans tarifaires de HaBiTa.",
    url: "https://habita-app.onrender.com/pricing",
  },
  alternates: {
    canonical: "https://habita-app.onrender.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
