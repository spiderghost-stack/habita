import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte propriétaire",
  description:
    "Créez votre compte HaBiTa gratuitement et commencez à gérer vos biens immobiliers, locataires et loyers simplement.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Créer un compte propriétaire | HaBiTa",
    description:
      "Rejoignez HaBiTa et simplifiez la gestion de vos biens locatifs.",
    url: "https://habita-app.onrender.com/register",
  },
  alternates: {
    canonical: "https://habita-app.onrender.com/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
