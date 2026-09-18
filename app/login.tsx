"use client";

import { ArrowLeft, LockKeyhole, LogIn } from "lucide-react";

export default function Login({ onSubmit, error, onBack }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; error: string; onBack: () => void }) {
  return <main className="login-shell"><div className="login-card"><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Retour à VibeRoom</button><div className="login-icon"><LockKeyhole size={22} /></div><div className="section-kicker">ESPACE PRIVÉ</div><h1>Tableau de bord<br /><em>VibeRoom.</em></h1><p>Un seul compte administrateur pour lire les projets, les noter et préparer le prochain TikTok LIVE.</p><form onSubmit={onSubmit}><label>Email<input required name="email" type="email" placeholder="ton@email.com" autoComplete="username" /></label><label>Mot de passe<input required name="password" type="password" placeholder="••••••••" autoComplete="current-password" /></label><button className="button button-coral submit-button" type="submit">Se connecter <LogIn size={16} /></button>{error && <div className="login-error">{error}</div>}</form><a className="login-tiktok" href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">TikTok · @salomondiei ↗</a></div></main>;
}
