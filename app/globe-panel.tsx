"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { feature } from "topojson-client";
import type { GlobeMethods } from "react-globe.gl";
import type { Application } from "../lib/applications";
import { locateApplications } from "../lib/geography";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });
import world from "world-atlas/countries-110m.json";

type Props = { applications: Application[]; selectedCountry: string | null; onCountrySelect: (country: string | null) => void; onProjectSelect: (id: number) => void };
type Point = { id: number; name: string; focus: string; lat: number; lng: number; color: string };

/** Real country polygons with one data point per submission with a recognized location. */
export default function GlobePanel({ applications, selectedCountry, onCountrySelect: _onCountrySelect, onProjectSelect }: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const located = useMemo(() => locateApplications(applications), [applications]);
  const points = useMemo<Point[]>(() => located.flatMap(application => application.country ? [{ id: application.id, name: application.name, focus: application.focus, lat: application.country.lat, lng: application.country.lng, color: application.status === "Jugé" ? "#f0a08b" : application.status === "À suivre" ? "#8fd0ae" : "#f7d39d" }] : []), [located]);
  const polygons = useMemo(() => { const topology = world as any; return (feature(topology, topology.objects.countries) as any).features; }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (controls) { controls.autoRotate = true; controls.autoRotateSpeed = 0.35; controls.enableDamping = true; }
  }, []);

  return <div className="globe-stage" aria-label="Globe 3D des pays des projets">
    <div className="globe-legend"><span><i className="legend-dot legend-new" /> Nouveau</span><span><i className="legend-dot legend-follow" /> À suivre</span><span><i className="legend-dot legend-judged" /> Jugé</span></div>
    <Globe ref={globeRef} width={760} height={500} backgroundColor="rgba(0,0,0,0)" globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg" bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png" showAtmosphere atmosphereColor="#e8795e" atmosphereAltitude={0.16} polygonsData={polygons} polygonCapColor={() => "rgba(78,156,131,.20)"} polygonSideColor={() => "rgba(24,35,31,.35)"} polygonStrokeColor={() => "rgba(255,255,255,.26)"} polygonAltitude={0.012} pointsData={points} pointLat="lat" pointLng="lng" pointColor="color" pointRadius={0.38} pointAltitude={0.04} pointResolution={12} onPointClick={(point: object) => onProjectSelect((point as Point).id)} pointLabel={(point: object) => "<b>" + (point as Point).focus + "</b><br/>" + (point as Point).name} />
    {!points.length && <div className="globe-empty">Les points apparaîtront quand une ville ou un pays sera reconnu.</div>}
  </div>;
}
