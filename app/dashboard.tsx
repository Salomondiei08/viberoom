"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox, LoaderCircle, LogOut, RefreshCw, Search } from "lucide-react";
import { Application, isApplication, projectUrl, Status, statuses } from "../lib/applications";
import { requestJson, RequestError } from "../lib/client";

const statusStyle: Record<Status, string> = { Nouveau: "status-new", Sélectionné: "status-shortlisted", "À étudier": "status-review" };
function dateLabel(application: Application) {
  const date = new Date(application.createdAt || application.id);
  return application.createdAt || application.id > 1e12 ? date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " GMT" : "Ancien envoi";
}

/** Authentication is checked by each API, independently of this interface. */
export default function Dashboard() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [filter, setFilter] = useState<"Toutes" | Status>("Toutes");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mutation = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await requestJson("/api/applications");
      if (!Array.isArray(data) || !data.every(isApplication)) throw new Error("La liste des projets n’a pas pu être chargée.");
      setApplications(data.map(item => ({ ...item, status: ({ New: "Nouveau", Shortlisted: "Sélectionné", Review: "À étudier" } as Record<string, Status>)[item.status] || item.status })));
    } catch (failure) {
      if (failure instanceof RequestError && failure.status === 401) { setAuth("out"); setApplications([]); }
      setError((failure as Error).message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const session = await requestJson("/api/auth/me") as { authenticated?: boolean };
        if (active) setAuth(session.authenticated === true ? "in" : "out");
      } catch { if (active) { setAuth("out"); setError("Connexion au serveur impossible. Réessaie dans un instant."); } }
    }
    void check();
    return () => { active = false; };
  }, []);
  useEffect(() => { if (auth === "in") void load(); }, [auth, load]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true); setError("");
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      await requestJson("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), password: fields.get("password") }) });
      form.reset();
      setAuth("in");
    } catch (failure) { setError((failure as Error).message); }
    finally { mutation.current = false; setBusy(false); }
  }

  async function logout() {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError("");
    try {
      await requestJson("/api/auth/logout", { method: "POST" });
      setApplications([]); setSelectedId(undefined); setNotice(""); setAuth("out");
    } catch (failure) { setError((failure as Error).message); }
    finally { mutation.current = false; setBusy(false); }
  }

  const visible = applications.filter(item => (filter === "Toutes" || item.status === filter) && [item.name, item.focus, item.location, item.bio].join(" ").toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const selected = visible.find(item => item.id === selectedId) ?? visible[0];

  async function updateStatus(status: Status) {
    if (!selected || mutation.current) return;
    mutation.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const updated = await requestJson(`/api/applications/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!isApplication(updated)) throw new Error("Le changement n’a pas été confirmé.");
      setApplications(current => current.map(item => item.id === updated.id ? updated : item));
      setNotice("Statut enregistré.");
    } catch (failure) {
      if (failure instanceof RequestError && failure.status === 401) { setAuth("out"); setApplications([]); }
      setError((failure as Error).message);
    } finally { mutation.current = false; setBusy(false); }
  }

  if (auth === "checking") return <main id="main" className="login-shell"><p className="loading-state" role="status"><LoaderCircle className="spin" /> Vérification de la connexion…</p></main>;
  if (auth === "out") return <main id="main" className="login-shell"><div className="login-card">
    <Link className="back-link" href="/">← Retour à VibeRoom</Link>
    <div className="section-kicker">ESPACE PRIVÉ · SALOMON</div><h1>Ton tableau<br />de bord.</h1><p>Connecte-toi pour découvrir et sélectionner les projets reçus.</p>
    <form onSubmit={login} aria-busy={busy}><label>Email<input required name="email" type="email" maxLength={254} autoComplete="username" disabled={busy} /></label><label>Mot de passe<input required name="password" type="password" maxLength={256} autoComplete="current-password" disabled={busy} /></label><button className="button button-coral submit-button" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button></form>
    {error && <p className="form-error" role="alert">{error}</p>}
    <a className="login-tiktok" href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">TikTok · @salomondiei ↗</a>
  </div></main>;

  const url = selected && projectUrl(selected);
  return <main id="main" className="admin-shell">
    <header className="admin-header"><div><Link href="/" className="brand-lockup">VIBE<span className="brand-accent">ROOM</span></Link><h1>Projets reçus <span>{applications.length}</span></h1></div><div className="admin-actions"><Link className="button button-dark" href="/">Voir le site <ArrowUpRight size={16} /></Link><button className="button button-outline" disabled={busy} onClick={() => void logout()}><LogOut size={16} /> Se déconnecter</button></div></header>
    <div className="admin-body">
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="save-notice" role="status">{notice}</p>}
      <div className="admin-toolbar"><label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher un projet</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Projet, créateur, ville…" /></label><button className="button button-outline" disabled={loading || busy} onClick={() => void load()}><RefreshCw size={16} className={loading ? "spin" : ""} /> Actualiser</button></div>
      <div className="filter-tabs admin-filters" aria-label="Filtrer les projets">{(["Toutes", ...statuses] as const).map(status => <button key={status} aria-pressed={filter === status} className={filter === status ? "selected" : ""} onClick={() => setFilter(status)}>{status}<span>{status === "Toutes" ? applications.length : applications.filter(item => item.status === status).length}</span></button>)}</div>
      {loading && <p role="status">Chargement des projets…</p>}
      <div className="review-layout review-layout-clean">
        <section className="application-list" aria-label="Liste des projets"><div className="list-head">{visible.length} projet{visible.length !== 1 ? "s" : ""}</div>
          {!loading && !visible.length && <div className="empty-state"><Inbox size={36} /><h2>{applications.length ? "Aucun résultat" : "Les prochains projets arrivent ici"}</h2><p>{applications.length ? "Essaie un autre mot-clé ou un autre filtre." : "Les projets envoyés sur le site apparaîtront dans cette liste."}</p></div>}
          {visible.map(item => <button key={item.id} className={`application-item ${selected?.id === item.id ? "item-selected" : ""}`} aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}><div className="avatar">{item.initials}</div><div className="applicant-summary"><strong>{item.focus}</strong><span>{item.name} · {item.location}</span></div><span className={`status-pill ${statusStyle[item.status] || "status-new"}`}>{item.status}</span></button>)}
        </section>
        <section className="detail-panel" aria-label="Détail du projet">{selected ? <>
          <span className="detail-label">Détail du projet</span><h2 className="project-title">{selected.focus}</h2><p className="project-author">{selected.name} · {selected.location}</p>
          <span className={`status-pill ${statusStyle[selected.status] || "status-new"}`}>{selected.status}</span>
          {url && <a className="button button-dark project-link" href={url} target="_blank" rel="noopener noreferrer">Ouvrir le projet <ArrowUpRight size={16} /></a>}
          <div className="detail-section"><h3>Description</h3><p>{selected.bio.replace(/ — Dépôt : https?:\/\/\S+\s*$/, "")}</p></div>
          <div className="detail-footer"><span>Reçu le {dateLabel(selected)}</span><div className="status-actions" aria-label="Changer le statut">{statuses.map(status => <button key={status} disabled={busy} aria-pressed={selected.status === status} className={selected.status === status ? "current" : ""} onClick={() => void updateStatus(status)}>{status}</button>)}</div></div>
        </> : <div className="empty-state"><p>Sélectionne un projet pour le découvrir.</p></div>}</section>
      </div>
    </div>
  </main>;
}
