import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeRoom — Montre ce que tu as construit",
  description: "VibeRoom, connecté à ton univers TikTok : les développeurs présentent et défendent leurs projets vibe-coded en direct.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><a className="tiktok-profile" href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">Salomon | AI and Code · TikTok LIVE @salomondiei <span>↗</span></a><a className="creator-credit" href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">Créé par Salomon · Voir mes vidéos TikTok ↗</a>{children}</body>
    </html>
  );
}
