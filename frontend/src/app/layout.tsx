import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const BASE_URL = "https://habita-app.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "HaBiTa — Logiciel de gestion locative et immobilière",
    template: "%s | HaBiTa",
  },
  description:
    "HaBiTa est une application web de gestion locative pour les propriétaires et gestionnaires de biens. Gérez vos logements, locataires, loyers, dépenses et contrats depuis un seul endroit.",
  keywords: [
    "gestion locative",
    "logiciel immobilier",
    "gestion de loyers",
    "propriétaire bailleur",
    "gestion de biens",
    "locataires",
    "quittance de loyer",
  ],
  authors: [{ name: "HaBiTa" }],
  creator: "HaBiTa",
  publisher: "HaBiTa",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "HaBiTa",
    title: "HaBiTa — Logiciel de gestion locative et immobilière",
    description:
      "Gérez vos logements, locataires, loyers, dépenses et contrats depuis un seul endroit avec HaBiTa.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Logo HaBiTa — Gestion locative",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HaBiTa — Logiciel de gestion locative et immobilière",
    description:
      "Gérez vos logements, locataires, loyers, dépenses et contrats depuis un seul endroit avec HaBiTa.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "HaBiTa",
    url: "https://habita-app.onrender.com",
    description:
      "HaBiTa est une application web de gestion locative pour les propriétaires et gestionnaires de biens. Gérez vos logements, locataires, loyers, dépenses et contrats.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "XOF",
    },
    inLanguage: "fr",
  };

  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${plusJakartaSans.variable} font-body antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
