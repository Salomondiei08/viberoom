"use client";
import { useEffect, useState } from "react";
const eventTime = Date.parse("2026-09-19T14:00:00Z");

/** The countdown becomes a neutral event link at start time, without claiming live status. */
export default function LiveBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, eventTime - Date.now()));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, []);
  const seconds = Math.floor((remaining ?? 0) / 1000);
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
  return <a className="event-banner" href="https://www.tiktok.com/live/event/7687004710078939143?enter_from=personal_live_event_card" target="_blank" rel="noreferrer"><span className="live-dot" aria-hidden="true" /><span>{remaining === 0 ? "Les projets de la communauté sur TikTok" : "Live TikTok · samedi 19 septembre à 14h GMT"}</span>{remaining !== null && remaining > 0 && <span className="countdown" aria-label="Compte à rebours avant le live">{countdown}</span>}<strong>Voir le live ↗</strong></a>;
}
