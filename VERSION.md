# Version history

## 0.4.0 — 2026-09-19

- Authentification renforcée : aucun secret de secours, sessions révocables, expiration de 8 heures, cookies stricts et limitation persistante des tentatives.
- Validation stricte des formulaires et statuts, contrôle d’origine, limites de taille, liens sûrs, consentement et détection des doublons.
- Écritures verrouillées et atomiques : conservation des projets lors d’envois simultanés et absence d’écrasement des données corrompues.
- Dashboard dédié à /dashboard avec recherche, filtres, états vides, actualisation, liens de projets et retours d’erreur fiables.
- Confirmation d’envoi accessible, formulaire réinitialisé, indicateur de chargement, navigation mobile, contraste et compte à rebours.
- En-têtes de sécurité, lecteur TikTok isolé, dépendance PostCSS corrigée, image Docker minimale sans secrets ni données et exécution non-root.
- Ajout des tests Jest de sécurité et des parcours Playwright avec audit axe et vérification des largeurs 320–1280 px.

## 0.4.1 — 2026-09-19

- Le lien de chaque projet est maintenant affiché dans une carte séparée du détail, visible, cliquable et copiable depuis le dashboard.
- Les tags du dashboard sont désormais « Nouveau », « À suivre » et « Jugé » ; toute nouvelle soumission arrive en « Nouveau ».

## 0.5.0 — 2026-09-19

- Ajout d’un centre analytics privé avec métriques réelles, activité sur 7 jours, répartition par pays et drilldown vers les projets.
- Ajout d’un globe 3D WebGL avec frontières réelles, points de localisation reconnus et sélection directe des projets.

## 0.3.2 — 2026-09-19

- Removed the generic TikTok banner and fictional hero project counter; the official live-event link is now the single live call to action.

## 0.3.0 — 2026-09-19

- Clarified that projects are submitted online, then tested and reviewed without the creator needing to attend the TikTok LIVE.
- Replaced legacy demo submissions with AI and vibe-coding project examples.

## 0.3.1 — 2026-09-19

- Fixed the public page crash caused by treating the protected dashboard error response as an application list.

## 0.4.0 — 2026-09-19

- Added duplicate-submit protection and a clear animated confirmation after a project is received.
- Simplified the private dashboard by removing fictional capacity, pulse, guest, episode, topic, and host-guide elements.

## 0.5.0 — 2026-09-19

- Added a prominent Salomon | AI and Code creator section with the official TikTok creator embed and direct profile links.
- Added verified profile copy and links to the live-announcement and vibe-coding TikTok videos.
- Replaced the generic TikTok banner with a direct event link for Saturday 19 at 14h GMT.

## 0.1.0 — 2026-09-19

- Added the LiveRoom public casting landing page with an animated hero and application flow.
- Added a responsive review control room with filters, statuses, notes, and a detail panel.
- Added local demo persistence so a submitted application appears immediately in the dashboard.

## 0.2.0 — 2026-09-19

- Added server-persistent application storage and status updates through `/api/applications`.
- Rewrote the public experience and control room in French with a more readable system font.
- Added visible TikTok connection messaging for the LiveRoom casting flow.
- Reframed the product as VibeRoom: a TikTok LIVE project showcase and judging room for developers and vibe coders.
- Added a single-account private login with server-signed HTTP-only sessions; signup is intentionally disabled.
- Added creator identity links for Salomon | AI and Code and the official TikTok profile.
