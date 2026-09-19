"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Globe2, MapPin, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import type { Application } from "../lib/applications";
import { locateApplications } from "../lib/geography";

const GlobePanel = dynamic(() => import("./globe-panel"), { ssr: false, loading: () => <div className="globe-loading">Chargement du globe 3D…</div> });
type Props = { applications: Application[]; onProjectSelect: (id: number) => void };

function countByDay(applications: Application[]) {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); return date; });
  return days.map(date => ({ label: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""), count: applications.filter(application => { if (!application.createdAt) return false; return new Date(application.createdAt).toDateString() === date.toDateString(); }).length }));
}

/** All metrics are derived from the private application list; no sample numbers are used. */
export default function AnalyticsOverview({ applications, onProjectSelect }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const located = useMemo(() => locateApplications(applications), [applications]);
  const countryRows = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; ids: number[] }>();
    for (const application of located) if (application.country) { const current = counts.get(application.country.key) || { name: application.country.name, count: 0, ids: [] }; current.count += 1; current.ids.push(application.id); counts.set(application.country.key, current); }
    return [...counts.entries()].map(([key, value]) => ({ key, ...value })).sort((a, b) => b.count - a.count);
  }, [located]);
  const trend = useMemo(() => countByDay(applications), [applications]);
  const maxTrend = Math.max(1, ...trend.map(day => day.count));
  const countryProjects = selectedCountry ? located.filter(item => item.country?.key === selectedCountry) : [];
  const knownLocations = located.filter(item => item.country).length;
  const topCountry = countryRows[0];

  return <section className="analytics-overview" aria-label="Analyses des projets">
    <div className="analytics-heading"><div><span className="detail-label">Vue d’ensemble</span><h2>Les projets, <em>en mouvement.</em></h2><p>Localisations et tendances calculées depuis les candidatures reçues.</p></div><div className="analytics-live"><span className="live-dot" /> Données en direct</div></div>
    <div className="analytics-metrics"><article className="metric-card"><span>Total projets</span><strong>{applications.length}</strong><small>soumissions reçues</small></article><article className="metric-card metric-new"><span>Nouveau</span><strong>{applications.filter(item => item.status === "Nouveau").length}</strong><small>à examiner</small></article><article className="metric-card metric-follow"><span>À suivre</span><strong>{applications.filter(item => item.status === "À suivre").length}</strong><small>à revoir</small></article><article className="metric-card metric-judged"><span>Jugé</span><strong>{applications.filter(item => item.status === "Jugé").length}</strong><small>évalués</small></article></div>
    <div className="analytics-grid">
      <article className="analytics-card globe-card"><div className="analytics-card-head"><div><span className="detail-label">Carte mondiale</span><h3>Où construisent-ils ?</h3></div><Globe2 size={22} /></div><GlobePanel applications={applications} selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} onProjectSelect={onProjectSelect} /><div className="globe-foot"><span><MapPin size={14} /> {knownLocations} projet{knownLocations !== 1 ? "s" : ""} localisé{knownLocations !== 1 ? "s" : ""}</span><span>{applications.length - knownLocations} à préciser</span></div></article>
      <div className="analytics-side"><article className="analytics-card country-card"><div className="analytics-card-head"><div><span className="detail-label">Répartition</span><h3>Projets par pays</h3></div><MapPin size={20} /></div>{countryRows.length ? <div className="country-list">{countryRows.map(row => <button key={row.key} className={selectedCountry === row.key ? "country-row selected" : "country-row"} onClick={() => setSelectedCountry(selectedCountry === row.key ? null : row.key)}><span className="country-name"><i className="country-swatch" />{row.name}</span><span className="country-bar"><i style={{ width: Math.max(10, row.count / (topCountry?.count || 1) * 100) + "%" }} /></span><strong>{row.count}</strong></button>)}</div> : <div className="analytics-empty">Aucun pays reconnu pour le moment.</div>}</article><article className="analytics-card trend-card"><div className="analytics-card-head"><div><span className="detail-label">Activité</span><h3>7 derniers jours</h3></div><TrendingUp size={20} /></div><div className="trend-chart" aria-label="Soumissions des sept derniers jours">{trend.map(day => <div className="trend-column" key={day.label}><span>{day.count}</span><i style={{ height: Math.max(5, day.count / maxTrend * 100) + "%" }} /><small>{day.label}</small></div>)}</div></article></div>
    </div>
    {selectedCountry && <div className="country-drilldown"><div><span className="detail-label">Pays sélectionné</span><h3>{countryRows.find(row => row.key === selectedCountry)?.name}</h3></div><div className="drilldown-projects">{countryProjects.map(project => <button key={project.id} onClick={() => onProjectSelect(project.id)}>{project.focus}<span>{project.name}<ArrowUpRight size={14} /></span></button>)}</div></div>}
  </section>;
}
