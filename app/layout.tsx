import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SargTrack — Suivi des sargasses en Guadeloupe",
  description:
    "Plateforme de suivi des échouages de sargasses : carte temps réel, signalements géolocalisés, reporting pour les communes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <nav className="nav">
          <Link href="/" className="logo">
            Sarg<span>Track</span>
          </Link>
          <div className="links">
            <Link href="/carte">Carte</Link>
            <Link href="/signaler">Signaler</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
