import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "@/styles/globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "HaBiTa — Gestion immobilière",
  description: "Gérez vos maisons, vos locataires et vos loyers depuis un seul endroit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${fraunces.variable} ${inter.variable} font-body`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
