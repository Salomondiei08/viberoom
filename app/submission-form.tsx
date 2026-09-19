"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, LoaderCircle, Send } from "lucide-react";
import { requestJson } from "../lib/client";

/** Replace the form only after the API confirms a durable submission. */
export default function SubmissionForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "duplicate">("idle");
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const success = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state === "sent" || state === "duplicate") success.current?.focus(); }, [state]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    inFlight.current = true;
    setState("sending");
    setError("");
    try {
      const data = await requestJson("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), location: form.get("location"), focus: form.get("project"), bio: form.get("description"), repository: form.get("repository"), consent: form.get("consent") === "on", website: form.get("website") }) }) as { ok?: boolean; duplicate?: boolean };
      if (!data.ok) throw new Error("L’envoi n’a pas été confirmé. Réessaie.");
      element.reset();
      setState(data.duplicate ? "duplicate" : "sent");
    } catch (failure) { setError((failure as Error).message); setState("idle"); }
    finally { inFlight.current = false; }
  }

  if (state === "sent" || state === "duplicate") return <div className="submission-success" ref={success} tabIndex={-1} role="status">
    <span className="success-icon"><Check size={32} aria-hidden="true" /></span>
    <h3>{state === "duplicate" ? "Ce projet est déjà reçu." : "Ton projet est bien reçu !"}</h3>
    <p>{state === "duplicate" ? "Ce lien est déjà dans la liste. Inutile de le renvoyer." : "Il est enregistré dans la liste des projets à découvrir. La sélection sera faite pendant le live."}</p>
    <a className="button button-dark" href="https://www.tiktok.com/live/event/7687004710078939143" target="_blank" rel="noreferrer">Retrouver le live <ArrowUpRight size={16} /></a>
    <button className="back-link" onClick={() => setState("idle")}>Proposer un autre projet</button>
  </div>;

  return <form className="application-form" onSubmit={submit} aria-busy={state === "sending"}>
    <div className="form-header"><span>Ton projet</span><span>~ 3 min</span></div>
    <fieldset disabled={state === "sending"}>
      <legend className="sr-only">Informations sur ton projet</legend>
      <label>Ton nom<input required minLength={2} maxLength={100} name="name" autoComplete="name" placeholder="ex. Mariam Koné" /></label>
      <div className="form-row"><label>Ville, pays<input required minLength={2} maxLength={100} name="location" placeholder="Abidjan, Côte d’Ivoire" /></label><label>Nom du projet<input required minLength={2} maxLength={150} name="project" placeholder="ex. Agent IA pour artisans" /></label></div>
      <label>Lien du projet ou de la démo<input required name="repository" type="url" maxLength={2048} placeholder="https://..." autoCapitalize="none" spellCheck={false} /></label>
      <label>Que veux-tu nous montrer ?<textarea required minLength={20} maxLength={5000} name="description" rows={5} placeholder="Le problème, ce que tu as construit, les outils utilisés et ce que tu aimerais améliorer…" /></label>
      <div className="honeypot" aria-hidden="true"><label>Site personnel<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="consent"><input required type="checkbox" name="consent" /><span>J’accepte que mon projet et les informations envoyées soient présentés et commentés pendant le TikTok LIVE.</span></label>
      <p className="privacy-note">Ces informations sont accessibles à Salomon pour préparer le live. N’envoie aucun mot de passe ni donnée confidentielle. Pour demander une suppression, contacte <a href="https://www.tiktok.com/@salomondiei" target="_blank" rel="noreferrer">@salomondiei</a>.</p>
      <button className="button button-coral submit-button" type="submit">{state === "sending" ? <>Envoi en cours… <LoaderCircle className="spin" size={18} /></> : <>Envoyer le projet <Send size={16} /></>}</button>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}
