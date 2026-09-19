import type { Metadata } from "next";
import LiveBanner from "./live-banner";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://vibecode.reinvent-labs.com"),
  title: "VibeRoom — Tes projets en live avec Salomon",
  description: "Soumets ton application ou ton SaaS. Salomon, IA & Code, le teste sur TikTok et partage des pistes pour l’améliorer avec la communauté.",
  openGraph: { title: "VibeRoom — Tes projets en live avec Salomon", description: "Fais découvrir ton projet et reçois des retours concrets pendant le live TikTok.", locale: "fr_FR", type: "website" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><a className="skip-link" href="#main">Aller au contenu</a><LiveBanner />{children}</body></html>;
}
