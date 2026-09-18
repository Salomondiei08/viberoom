import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeRoom — Montre ce que tu as construit",
  description: "VibeRoom, connecté à ton univers TikTok : les développeurs soumettent leurs projets vibe-coded pour une analyse en direct.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><a className="tiktok-profile live-event-link" href="https://www.tiktok.com/live/event/7687004710078939143?enter_from=personal_live_event_card" target="_blank" rel="noreferrer"><span className="live-dot" /> Live TikTok · samedi 19 à 14h GMT <span>Ouvrir le live ↗</span></a><a className="creator-credit" href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">Créé par Salomon · Voir mon TikTok ↗</a>{children}<Script src="https://www.tiktok.com/embed.js" strategy="afterInteractive" /></body>
    </html>
  );
}
