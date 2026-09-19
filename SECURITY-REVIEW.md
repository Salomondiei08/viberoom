# Audit VibeRoom — 19 septembre 2026

Périmètre : code de cette application, API, authentification administrateur, formulaire public, dashboard, dépendances npm et déploiement Docker de vibecode.reinvent-labs.com. Aucun test offensif sur TikTok ni sur les autres services du serveur.

## Problèmes identifiés et corrections

| Problème observé | Correction |
| --- | --- |
| Secret de signature de secours prévisible | Connexion refusée si AUTH_SECRET manque ou est trop court |
| Cookies insuffisamment validés, sessions toujours utilisables après logout | Format strict, identité et expiration vérifiées, registre de sessions et révocation serveur |
| Connexion sans limite de tentatives | Compteurs persistants, 8 essais par IP / 15 minutes et Retry-After |
| Formulaire acceptant des objets, champs arbitraires, absence de validation URL | Schémas stricts, limites de longueur, consentement explicite et URL HTTP(S) |
| Modification de n’importe quel champ via PATCH | Seul un statut autorisé peut être modifié |
| Doublons et pertes possibles lors d’écritures simultanées | Verrou interprocessus, remplacement atomique et dédoublonnage par URL |
| Fichier corrompu automatiquement écrasé par un tableau vide | Erreur contrôlée sans remplacement du fichier |
| JSON malformé et requêtes excessives non gérés | Lecture bornée des flux, erreurs 400/413/415 et messages français |
| Absence de contrôle d’origine | Vérification Origin et Sec-Fetch-Site sur les mutations |
| Données et secrets potentiellement inclus dans le contexte Docker | .dockerignore explicite, image standalone, données persistées uniquement dans le volume |
| Conteneur root et stockage sans restriction | UID/GID de l’hôte, filesystem en lecture seule, capacités retirées et fichiers privés |
| En-têtes navigateur manquants | CSP, anti-framing, nosniff, HSTS, politique de référent et permissions |
| Dépendance PostCSS vulnérable | Override vers la version corrigée 8.5.28 ; audit npm sans vulnérabilité connue |
| Formulaire sans erreurs visibles et confirmation fragile | États de chargement, erreur et confirmation distincts ; conservation des saisies en cas d’échec |
| Filtres inactifs, dashboard vide inaccessible et actions optimistes trompeuses | Route /dashboard, recherche et filtres réels, état vide et confirmation serveur des statuts |
| Navigation mobile absente et faibles contrastes | Menu mobile, contrôles tactiles, focus clavier, polices système et contrastes corrigés |
| Ancien composant avec requête privée au chargement public | Suppression de l’ancienne page et séparation du parcours administrateur |

## Vérification reproductible

- `npm test` : tests de sécurité des routes, stockage concurrent, sessions, logout, validation, limites et conservation des fichiers corrompus.
- `npm run test:e2e` : Chromium, soumission réelle sur stockage temporaire, doublon, login, dashboard vide, recherche, filtres, sauvegarde des statuts, rechargement et logout.
- Tests d’erreurs de réseau et conservation des saisies.
- Contrôle de débordement à 320, 375, 480, 768 et 1280 px ; captures de landing et dashboard.
- axe : règles WCAG A/AA automatiques sur nos écrans. Le HTML interne du lecteur TikTok, contrôlé par TikTok, est exclu ; un défaut d’alternative textuelle y a été observé.
- `npm run build`, `npm run lint`, `git diff --check`, `npm audit`.
- `scripts/production-check.mjs` : vérification publique et authentifiée sans afficher de données personnelles ni modifier les projets.

## Exploitation et limites

- APP_ORIGIN doit être l’origine HTTPS publique exacte. TRUST_PROXY ne doit être activé que derrière le proxy de confiance ; le service n’est publié que sur 127.0.0.1.
- DATA_DIR est optionnel ; sa valeur par défaut est ./data. Le volume doit appartenir à APP_UID/APP_GID (1001 sur ce serveur). Les tests utilisent des répertoires temporaires distincts.
- Les identifiants existants restent valides. ADMIN_PASSWORD_HASH accepte aussi un hash `scrypt:sel:hashHex` pour une migration ultérieure. Le fichier .env doit rester en mode 600. Les changements d’identifiants invalident les sessions existantes.
- Stockage JSON adapté à une instance unique et au volume actuel. Les verrous protègent les processus partageant le même filesystem local ; une extension multi-serveur nécessitera une base de données partagée.
- Les nouvelles sessions expirent après 8 heures. Les anciennes sessions sont invalidées lors de cette mise à jour.
- Le lecteur TikTok dépend du réseau et des règles de TikTok ; les liens directs restent disponibles.
- La CSP conserve `unsafe-inline` pour les scripts d’hydratation Next.js et les styles. Les contenus soumis sont rendus en texte par React, jamais en HTML brut.
- Limitation de débit et honeypot réduisent les abus sans constituer une protection DDoS distribuée.
- L’audit npm porte sur les dépendances déclarées ; il ne remplace pas un scan de l’OS et de toutes les images du serveur.
- Une sauvegarde de déploiement est prévue avant le remplacement du conteneur. Aucun dispositif de sauvegarde externe périodique n’est établi par cet audit.
- Un audit ponctuel et des contrôles automatiques ne garantissent pas l’absence de toute vulnérabilité ni une conformité WCAG complète.
