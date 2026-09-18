"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Code2, Play, Send, Sparkles, Trophy } from "lucide-react";
import DashboardFr from "./dashboard";
import Login from "./login";
import type { Application, Status } from "./page";

export default function VibePage() {
  const [view, setView] = useState<"landing" | "dashboard" | "login">("landing");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submittingRef = useRef(false);
  const [auth, setAuth] = useState<"checking" | "logged-out" | "logged-in">("checking");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.json()).then((session: { authenticated: boolean }) => {
      setAuth(session.authenticated ? "logged-in" : "logged-out");
    }).catch(() => setAuth("logged-out"));
  }, []);

  useEffect(() => {
    if (auth !== "logged-in") return;
    fetch("/api/applications").then((response) => response.json()).then((data: Application[]) => {
      setApplications(data);
      setSelectedId(data[0]?.id ?? 0);
    }).catch(() => undefined);
  }, [auth]);

  const login = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    const form = new FormData(event.currentTarget);
    fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }).then(async (response) => {
      if (!response.ok) throw new Error((await response.json()).error);
      setAuth("logged-in");
      setView("dashboard");
    }).catch((error: Error) => setAuthError(error.message));
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      setAuth("logged-out");
      setView("landing");
    });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || submitted) return;
    submittingRef.current = true;
    setSubmitError("");
    const form = new FormData(event.currentTarget);
    const payload = { name: String(form.get("name")), location: String(form.get("location")), focus: String(form.get("project")), bio: `${String(form.get("description"))} — Dépôt : ${String(form.get("repository"))}` };
    fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(async (response) => {
      if (!response.ok) throw new Error("Impossible d’envoyer le projet pour le moment.");
      return response.json();
    }).then((application: Application) => {
      setApplications((current) => [application, ...current]);
      setSelectedId(application.id);
      setSubmitted(true);
      event.currentTarget.reset();
    }).catch((error: Error) => setSubmitError(error.message)).finally(() => { submittingRef.current = false; });
  };

  const selected = applications.find((application) => application.id === selectedId) ?? applications[0];
  const updateStatus = (status: Status) => {
    if (!selected) return;
    setApplications((current) => current.map((application) => application.id === selected.id ? { ...application, status } : application));
    fetch(`/api/applications/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => undefined);
  };

  if (view === "login" || (view === "dashboard" && auth !== "logged-in")) return <Login onSubmit={login} error={authError} onBack={() => setView("landing")} />;
  if (view === "dashboard" && selected && auth === "logged-in") return <DashboardFr applications={applications} selected={selected} visibleApplications={applications} selectedId={selectedId} setSelectedId={setSelectedId} filter="Toutes" setFilter={() => undefined} updateStatus={updateStatus} setView={setView} menuOpen={false} setMenuOpen={() => undefined} onLogout={logout} />;

  return <main className="site-shell">
    <header className="topbar"><div className="brand-lockup"><span className="brand-mark"><span /></span><span>VIBE<span className="brand-accent">ROOM</span></span></div><nav className="desktop-nav"><a href="#concept">Le challenge</a><a href="#how">Le format</a><a href="#submit">Participer</a></nav><div className="topbar-actions"><button className="text-button desktop-only" onClick={() => setView("dashboard")}>Ouvrir les projets <ArrowUpRight size={15} /></button><button className="button button-dark desktop-only" onClick={() => document.getElementById("submit")?.scrollIntoView({ behavior: "smooth" })}>Soumettre un projet <ArrowUpRight size={16} /></button></div></header>
    <section className="hero section-pad"><div className="hero-copy"><div className="eyebrow"><span className="live-dot" />Challenge ouvert · Saison 01</div><h1>Montre ce que<br /><em>tu as construit.</em></h1><p className="hero-description">Une émission TikTok LIVE dédiée aux développeurs et vibe coders. Tu envoies ton projet, puis je le teste et je donne mon avis avec la communauté.</p><div className="hero-actions"><button className="button button-coral" onClick={() => document.getElementById("submit")?.scrollIntoView({ behavior: "smooth" })}>Envoyer mon projet <ArrowUpRight size={17} /></button><button className="watch-link" onClick={() => document.getElementById("concept")?.scrollIntoView({ behavior: "smooth" })}><span className="play-circle"><Play size={12} fill="currentColor" /></span> Comprendre le format</button></div></div><div className="hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-glow" /><div className="portrait-card"><div className="portrait-top"><span className="recording"><i /> PROJET EN DIRECT</span><span>01 / 04</span></div><div className="project-art"><Code2 size={74} /><span>BUILD<br />IN PUBLIC</span></div><div className="portrait-caption"><span>VIBE ROOM / 01</span><strong>Le projet est<br />la preuve.</strong></div></div><div className="floating-note note-one"><Sparkles size={14} /><span><b>Pas de pitch vide.</b><br />Montre le produit.</span></div><div className="floating-note note-two"><Trophy size={15} /><span>On analyse le build,<br />pas le CV.</span></div><div className="art-label">L/01 <span>Les builds en mouvement</span></div></div></section>
    <div className="ticker"><div>POUR LES DÉVELOPPEURS ✦ LES VIBE CODERS ✦ LES MAKERS ✦ LES PROJETS QUI MÉRITENT D’ÊTRE VUS ✦ POUR LES DÉVELOPPEURS ✦</div></div>
    <section id="concept" className="manifesto section-pad"><div className="section-kicker">01 — LE CHALLENGE</div><div className="manifesto-grid"><h2>Moins de<br /><em>promesses.</em><br />Plus de produit.</h2><div className="manifesto-copy"><p>VibeRoom est le rendez-vous TikTok LIVE où les développeurs soumettent leurs projets vibe-coded : applications, agents IA, outils, jeux et expériences web.</p><p>Tu envoies ton projet en ligne. Ensuite, je l’examine et je donne mon avis avec la communauté, sans que tu aies besoin d’être présent.</p><a href="#submit" className="arrow-link">Voir les critères d’analyse <ArrowUpRight size={16} /></a></div></div></section>
    <section id="how" className="how-section section-pad"><div className="section-kicker">02 — LE FORMAT</div><div className="section-heading"><h2>Du build<br />à l’<em>avis.</em></h2><p>Une fiche claire. Un projet réel.<br />Un retour utile et transparent.</p></div><div className="steps"><div className="step-card step-featured"><span className="step-number">01</span><div className="step-icon"><Code2 size={24} /></div><h3>Envoie ton<br />projet</h3><p>Lien, description et contexte. Pas besoin d’un dossier de 40 pages.</p><ArrowUpRight className="step-arrow" size={20} /></div><div className="step-card"><span className="step-number">02</span><div className="step-icon"><Play size={24} /></div><h3>Le projet est<br />testé</h3><p>Je découvre le produit et vérifie ce qui fonctionne réellement.</p></div><div className="step-card"><span className="step-number">03</span><div className="step-icon"><Trophy size={24} /></div><h3>Je donne<br />mon avis</h3><p>Idée, utilité, design et qualité d’exécution : les critères sont visibles.</p></div></div></section>
    <section id="submit" className="apply-section section-pad"><div className="apply-intro"><div className="section-kicker">03 — À TOI DE JOUER</div><h2>Montre le<br /><em>build.</em></h2><p>Soumets un projet que tu as vraiment construit. Le but n’est pas d’être parfait : c’est de rendre ton travail visible.</p><div className="apply-note"><Sparkles size={16} /><span>Les projets vibe-coded sont les bienvenus.<br /><strong>Les vrais liens aussi.</strong></span></div></div><form className="application-form" onSubmit={submit}><div className="form-header"><span>Projet / 01</span><span>~ 3 min</span></div><label>Ton nom<input required name="name" placeholder="ex. Mariam Koné" /></label><div className="form-row"><label>Ville, pays<input required name="location" placeholder="Abidjan, Côte d’Ivoire" /></label><label>Nom du projet<input required name="project" placeholder="ex. Agent IA pour artisans" /></label></div><label>Lien du projet ou de la démo<input required name="repository" type="url" placeholder="https://..." /></label><label>Que veux-tu nous montrer ?<textarea required name="description" rows={4} placeholder="Le problème, ce que tu as construit et ce qui rend le projet intéressant..." /></label><label className="consent"><input required type="checkbox" /> <span>J’accepte que mon projet soit examiné et commenté pendant le TikTok LIVE.</span></label><button className="button button-coral submit-button" type="submit">Envoyer le projet <Send size={16} /></button>{submitted && <div className="success-message"><Check size={17} /> Projet reçu. Il sera examiné pendant le TikTok LIVE.</div>}</form></section>
    <section className="creator-section section-pad"><div className="creator-copy"><div className="section-kicker">CRÉÉ ET ANIMÉ PAR</div><h2>Salomon<br /><em>AI & Code.</em></h2><p>AI Engineer living in SK 🇰🇷 · I talk about AI and Tech. Je teste des produits, je construis avec l’IA et je partage mes retours en direct.</p><a className="button button-coral" href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">Voir mon TikTok <ArrowUpRight size={16} /></a><div className="creator-links"><a href="https://www.tiktok.com/@salomondiei/video/7687011822784007442" target="_blank" rel="noreferrer"><strong>Annonce live</strong><span>Je teste vos projets en live ↗</span></a><a href="https://www.tiktok.com/@salomondiei/video/7686951883704995079" target="_blank" rel="noreferrer"><strong>Retour en live</strong><span>Live demain à 14h GMT ↗</span></a><a href="https://www.tiktok.com/@salomondiei/video/7680259767129869575" target="_blank" rel="noreferrer"><strong>Vibe coding</strong><span>Conseils pour bien vibe coder ↗</span></a></div></div><div className="creator-profile-card"><blockquote className="tiktok-embed" cite="https://www.tiktok.com/@salomondiei" data-unique-id="salomondiei" data-embed-from="oembed" data-embed-type="creator"><section><a target="_blank" rel="noreferrer" href="https://www.tiktok.com/@salomondiei?refer=creator_embed">@salomondiei</a></section></blockquote><div className="creator-profile-fallback"><div className="creator-avatar">S</div><div><strong>Salomon | AI and Code</strong><span>@salomondiei · 3,2 k abonnés</span></div><a href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer" aria-label="Ouvrir le TikTok de Salomon">↗</a></div></div></section>
    <footer className="footer section-pad"><div className="brand-lockup"><span className="brand-mark"><span /></span><span>VIBE<span className="brand-accent">ROOM</span></span></div><a href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">Les projets vibe-coded, sur mon TikTok ↗</a><span>© 2026 VibeRoom</span></footer>
  </main>;
}
