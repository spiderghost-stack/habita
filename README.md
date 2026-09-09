# HaBiTa

Plateforme de gestion immobilière — centraliser les propriétés, les unités, les
locataires, les loyers et les paiements dans un seul endroit.

Ce dépôt contient deux projets indépendants :

```
habita/
├── backend/     API Node.js / Express / PostgreSQL (Prisma)
├── frontend/    Application Next.js (App Router) / Tailwind
└── render.yaml  Blueprint de déploiement Render
```

Chaque dossier a son propre `package.json`, son propre `.env` et se déploie
séparément. Ils communiquent uniquement via l'API HTTP.

## Ce qui est construit

Toutes les sections du cahier des charges ont du code correspondant :

- authentification, gestion du profil, changement de mot de passe
- propriétés, unités, locataires (créer/modifier/supprimer)
- paiements manuels, reçus PDF avec QR code
- dépenses, contrats de location (renouvellement, résiliation, alerte 30 jours)
- tableau de bord : loyers, dépenses, revenu net, occupation, retards
- espace locataire séparé : consultation, historique, reçus, signalements, messagerie
- gestion multi-propriétaires pour les gestionnaires (plusieurs propriétaires, un compte gestionnaire)
- rappels et notifications par email (échéance, retard, expiration de contrat), manuels ou via cron
- signalement de problèmes avec upload de photo (si Cloudinary configuré)
- messagerie propriétaire ↔ locataire
- rapports périodiques (CSV, envoi par email)
- score de gestion par propriété
- panel d'administration (rôles, plans d'abonnement)
- modèle économique à paliers (Gratuit/Starter/Pro/Business), limites réellement appliquées

**Trois choses restent hors de portée du code seul** — WhatsApp Business API,
Mobile Money, et la facturation réelle des abonnements — parce qu'elles
nécessitent des comptes tiers que toi seul peux ouvrir. Le détail complet de
ce qui est limité ou en attente est dans `FONCTIONNALITES_RESTANTES.md`.

## Démarrage local

Prérequis : Node.js 18+, PostgreSQL (local ou distant), npm.

### Backend

```bash
cd backend
cp .env.example .env      # renseigner DATABASE_URL et JWT_SECRET au minimum
npm install
npx prisma migrate dev    # crée les tables
npm run prisma:seed       # optionnel — comptes et données de démo
npm run dev                # http://localhost:4000
```

Comptes créés par le seed (tous en `password123`) :
- propriétaire (plan Business) : `demo@habita.app`
- locataire : `jean.dupont@habita.app`
- gestionnaire : `gestionnaire@habita.app`
- administrateur : `admin@habita.app`

### Frontend

```bash
cd frontend
cp .env.example .env      # NEXT_PUBLIC_API_URL doit pointer vers le backend
npm install
npm run dev                # http://localhost:3000
```

## Documents utiles

- **`guide.md`** — tout ce qu'il te reste à faire à la main, étape par
  étape, avec les boutons et onglets précis à ouvrir (comptes, clés API,
  déploiement). Commence par là.
- `FONCTIONNALITES_RESTANTES.md` — état exact de chaque section du cahier
  des charges.
- `MANUAL_STEPS.md` — version plus technique des étapes manuelles (variables
  d'environnement, secrets).
- `DEPLOY_RENDER.md` — étapes détaillées pour héberger sur Render.
- `ROADMAP.md` — historique du développement, phase par phase.
