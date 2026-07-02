import type { Metadata } from "next";
import Link from "next/link";
import AccessGate from "./AccessGate";
import AuthStatus from "./AuthStatus";
import "./globals.css";

export const metadata: Metadata = {
  title: "SargTrack — Suivi des sargasses en Guadeloupe",
  description:
    "Plateforme de suivi des échouages de sargasses : carte temps réel, signalements géolocalisés, reporting pour les communes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AccessGate>
        <nav className="nav">
          <Link href="/" className="logo">
            <span className="dot">🌊</span>
            Sarg<span>Track</span>
          </Link>
          <div className="links">
            <Link href="/carte">Carte</Link>
            <AuthStatus />
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/signaler" className="cta-nav">
              Signaler
            </Link>
          </div>
        </nav>
        {children}
        </AccessGate>
      </body>
    </html>
  );
}
