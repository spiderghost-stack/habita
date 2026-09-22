import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace HaBiTa pour gérer vos biens immobiliers, vos locataires et vos loyers.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Connexion | HaBiTa",
    description: "Connectez-vous à votre espace HaBiTa pour gérer vos biens immobiliers.",
    url: "https://habita-app.onrender.com/login",
  },
  alternates: {
    canonical: "https://habita-app.onrender.com/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
