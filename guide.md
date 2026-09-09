# Guide pas à pas — tout ce que tu dois faire toi-même

Ce guide part du principe que tu as le dossier `habita/` (backend + frontend)
sur ton ordinateur et que tu ne l'as pas encore mis en ligne. Suis les
sections dans l'ordre — chacune dépend souvent de la précédente. Les noms de
boutons correspondent à l'état actuel de ces sites ; si un intitulé a changé
depuis, cherche l'option la plus proche (ces interfaces évoluent souvent).

---

## Partie 1 — Mettre le code sur GitHub

Render déploie depuis un dépôt Git, pas depuis un zip.

1. Va sur **github.com**, connecte-toi (ou crée un compte via **Sign up**
   en haut à droite).
2. Clique sur le bouton vert **New** en haut à gauche de la page d'accueil
   (ou le **+** en haut à droite → **New repository**).
3. Dans **Repository name**, mets `habita`. Laisse-le en **Private** si tu
   ne veux pas que le code soit public.
4. Ne coche **aucune** des cases (pas de README, pas de .gitignore, pas de
   licence) — tu as déjà ces fichiers.
5. Clique **Create repository**.
6. Sur la page qui s'affiche, sous "…or push an existing repository from
   the command line", copie les trois commandes affichées. Ouvre un
   terminal dans le dossier `habita/` et exécute-les. Ça ressemble à :
   ```
   git init
   git remote add origin https://github.com/TON-COMPTE/habita.git
   git add .
   git commit -m "Premier envoi"
   git branch -M main
   git push -u origin main
   ```
   Si `git` te demande de te connecter, suis les instructions à l'écran
   (GitHub demande maintenant un jeton d'accès personnel plutôt qu'un mot
   de passe — l'invite de commande t'y guidera).
7. Rafraîchis la page GitHub : tu dois voir les dossiers `backend/`,
   `frontend/` et les fichiers `.md`.

---

## Partie 2 — Créer un compte Render et déployer

1. Va sur **render.com** → **Get Started** ou **Sign Up**.
2. Choisis **Sign up with GitHub** (le plus simple, ça connecte directement les deux
   comptes) et autorise l'accès quand GitHub te le demande.
3. Une fois sur le tableau de bord Render, clique **New** (bouton en haut
   à droite) → **Blueprint**.
4. Render te demande de choisir un dépôt GitHub — sélectionne `habita`. Si
   tu ne le vois pas, clique **Configure account** et donne l'accès au
   dépôt depuis la page GitHub qui s'ouvre.
5. Render lit le fichier `render.yaml` à la racine et te propose de créer
   trois ressources : `habita-db` (base de données), `habita-api`
   (backend), `habita-app` (frontend), et un job `habita-rappels-quotidiens`.
   Vérifie les noms proposés, puis clique **Apply** (ou **Create New
   Resources**, le libellé exact varie).
6. Render construit d'abord la base de données, puis les deux services web.
   Ça prend entre 5 et 10 minutes la première fois — tu peux suivre la
   progression dans l'onglet **Logs** de chaque service.

### Si le blueprint échoue ou si tu préfères tout faire à la main

Suis `DEPLOY_RENDER.md`, section "Option B — création manuelle" — les
mêmes étapes que ci-dessus mais service par service, avec plus de contrôle
sur chaque champ.

### Une fois les trois services créés

7. Clique sur le service **habita-api** dans la liste. Onglet **Settings**
   (menu de gauche) → repère l'URL en haut de page, du style
   `https://habita-api-xxxx.onrender.com`. Note-la.
8. Fais pareil pour **habita-app** → note son URL
   (`https://habita-app-xxxx.onrender.com`).
9. Retourne dans **habita-api** → onglet **Environment** (menu de gauche)
   → repère la ligne `FRONTEND_URL` → clique le crayon (éditer) → colle
   l'URL de `habita-app` notée à l'étape 8 → **Save Changes**. Render
   redéploie automatiquement.
10. Va dans **habita-app** → onglet **Environment** → repère
    `NEXT_PUBLIC_API_URL` → édite-la pour mettre l'URL de `habita-api`
    **suivie de `/api/v1`** (exemple :
    `https://habita-api-xxxx.onrender.com/api/v1`) → **Save Changes**.

Sans cette étape 9-10, l'application affichera un écran de chargement
infini à la connexion — c'est le symptôme classique d'une URL mal reliée.

---

## Partie 3 — Créer les tables dans la base de données

Le `buildCommand` du blueprint exécute déjà `npx prisma migrate deploy`
automatiquement à chaque déploiement de `habita-api` — normalement tu n'as
rien à faire. Pour vérifier que ça a fonctionné :

1. Dans Render, ouvre **habita-api** → onglet **Logs**.
2. Cherche une ligne mentionnant `migrate deploy` ou `All migrations have
   been successfully applied` — c'est le signe que les tables existent.
3. Si tu veux ajouter les données de démonstration (comptes de test), il
   faut le faire depuis ton ordinateur, connecté à la base Render :
   - Dans Render, ouvre **habita-db** → onglet **Connect** → copie la
     valeur **External Database URL**.
   - Dans ton terminal, dossier `backend/` :
     ```
     DATABASE_URL="colle-l-url-ici" npm run prisma:seed
     ```
   - **Change les mots de passe de ces comptes de démo avant d'inviter de
     vrais utilisateurs** (voir Partie 8).

---

## Partie 4 — Configurer l'envoi d'email (rappels de loyer)

Sans ça, l'application fonctionne mais aucun rappel n'est réellement
envoyé — seulement noté dans les logs. Recommandation : **Brevo**
(ex-Sendinblue), gratuit jusqu'à 300 emails/jour, simple à configurer.

### Créer le compte Brevo

1. Va sur **brevo.com** → **S'inscrire gratuitement** (ou **Sign up free**).
2. Renseigne email, mot de passe, nom de société (mets "HaBiTa"), valide
   ton adresse email en cliquant le lien reçu.
3. Une fois connecté, Render te demande peut-être de confirmer ton
   numéro de téléphone par SMS — suis les instructions.

### Récupérer les identifiants SMTP

4. En haut à droite, clique sur ton **nom de compte** (ou ton avatar) →
   **SMTP & API** dans le menu qui s'ouvre (parfois sous **Paramètres du
   compte**).
5. Onglet **SMTP** (pas "API Keys") → tu verras :
   - **Serveur SMTP** : `smtp-relay.brevo.com`
   - **Port** : `587`
   - **Login** : ton adresse email Brevo
   - **Mot de passe** : clique **Générer une nouvelle clé SMTP** si aucune
     n'existe, donne-lui un nom ("HaBiTa production"), copie la valeur
     générée immédiatement (elle ne sera plus jamais affichée en entier).

### Renseigner ces valeurs dans Render

6. Retourne sur Render → **habita-api** → onglet **Environment**.
7. Édite ces quatre variables (déjà présentes, vides par défaut) :
   - `SMTP_HOST` → `smtp-relay.brevo.com`
   - `SMTP_PORT` → `587`
   - `SMTP_USER` → ton email Brevo
   - `SMTP_PASS` → la clé SMTP copiée à l'étape 5
8. **Save Changes**. Render redéploie automatiquement (1-2 minutes).

### Tester

9. Connecte-toi à l'application en propriétaire, va sur **Tableau de
   bord** → bouton **Envoyer les rappels maintenant**. Si un locataire de
   test a une échéance proche ou en retard, tu dois recevoir un email
   (vérifie aussi les spams la première fois).

---

## Partie 5 — Configurer le cron des rappels quotidiens

Le blueprint a créé un service `habita-rappels-quotidiens` qui doit
appeler l'API chaque jour automatiquement.

1. Sur Render, ouvre **habita-api** → onglet **Environment** → repère
   `CRON_SECRET` → clique l'icône œil pour révéler sa valeur → copie-la.
2. Ouvre **habita-rappels-quotidiens** → onglet **Environment** → édite
   `CRON_SECRET` → colle la même valeur → **Save Changes**.
3. Onglet **Settings** de ce même service → vérifie le champ **Schedule**
   (`0 7 * * *` par défaut = 7h UTC chaque jour). Modifie-le si tu veux un
   autre horaire (le format est celui d'un cron Unix classique : minute,
   heure, jour du mois, mois, jour de la semaine).

### Alternative sans service Render supplémentaire

Si tu préfères ne pas payer/gérer ce service séparé :

1. Va sur **cron-job.org** → **Sign up** (gratuit).
2. Une fois connecté, **Create cronjob**.
3. **Title** : "Rappels HaBiTa".
4. **URL** : `https://habita-api-xxxx.onrender.com/api/v1/notifications/run-global`
5. **Schedule** : choisis "Every day" et l'heure voulue.
6. Onglet **Advanced** (ou **Headers**) → ajoute un en-tête personnalisé :
   nom `x-cron-secret`, valeur = la valeur de `CRON_SECRET` copiée
   ci-dessus.
7. **Save**.
8. Dans `render.yaml`, tu peux alors supprimer le bloc `type: cron` pour
   ne pas payer deux fois — ou le laisser désactivé, à ta convenance.

---

## Partie 6 — Configurer l'upload de photos (Cloudinary)

Sans ça, un locataire ne peut pas joindre de photo à un signalement
(erreur claire affichée, rien ne casse).

1. Va sur **cloudinary.com** → **Sign Up for Free**.
2. Renseigne email/mot de passe (ou "Sign up with Google"), valide ton
   email.
3. Cloudinary te demande parfois ton cas d'usage à l'inscription — choisis
   n'importe quelle option, ce n'est pas bloquant.
4. Une fois connecté, tu arrives sur le **Dashboard**. En haut de la page,
   sous "Product Environment Credentials" (ou dans **Settings** → icône
   d'engrenage en haut à droite → onglet **Access Keys**), tu verras trois
   valeurs :
   - **Cloud name**
   - **API Key**
   - **API Secret** (clique l'icône œil pour l'afficher)
5. Retourne sur Render → **habita-api** → onglet **Environment** → édite :
   - `CLOUDINARY_CLOUD_NAME` → la valeur "Cloud name"
   - `CLOUDINARY_API_KEY` → la valeur "API Key"
   - `CLOUDINARY_API_SECRET` → la valeur "API Secret"
6. **Save Changes**.
7. Teste : connecte-toi comme locataire de démo (`jean.dupont@habita.app`)
   → section **Signaler un problème** → **+ Nouveau signalement** → choisis
   un fichier image dans le champ **Photo**. Si "Photo jointe ✓" apparaît,
   ça fonctionne.

---

## Partie 7 — Domaine personnalisé (optionnel)

Si tu as acheté un nom de domaine (ex: `habita.bj` ou `app.habita.bj`) :

1. Sur Render, ouvre **habita-app** → onglet **Settings** → section
   **Custom Domains** → **Add Custom Domain**.
2. Tape ton domaine, Render t'indique un enregistrement DNS à créer (type
   `CNAME` en général) avec une valeur du type `xxxx.onrender.com`.
3. Va chez ton registrar de domaine (où tu as acheté le nom — Namecheap,
   OVH, Whogohost, etc.), section **Gestion DNS** ou **DNS Zone**, ajoute
   l'enregistrement demandé.
4. Reviens sur Render, patiente (propagation DNS : de quelques minutes à
   quelques heures), le statut passe à **Verified** puis Render génère un
   certificat HTTPS automatiquement.
5. Répète pour `habita-api` si tu veux aussi un domaine personnalisé côté
   API (ex: `api.habita.bj`) — dans ce cas, refais l'étape 9-10 de la
   Partie 2 avec les nouveaux domaines.

---

## Partie 8 — Sécuriser les comptes de démonstration

Avant d'inviter un vrai utilisateur :

1. Connecte-toi à chacun des quatre comptes de démo
   (`demo@habita.app`, `jean.dupont@habita.app`, `gestionnaire@habita.app`,
   `admin@habita.app`, tous en `password123`).
2. Pour chacun : va sur **Mon profil** → section **Mot de passe** → change
   le mot de passe.
3. Si tu ne veux garder aucune donnée de démo, le plus simple est de
   supprimer directement les lignes correspondantes dans la base de
   données (via un client PostgreSQL comme **TablePlus** ou **pgAdmin**,
   connecté avec l'External Database URL de la Partie 3) plutôt que de
   cliquer partout dans l'interface.

---

## Partie 9 — Ce qui nécessite un compte que je ne peux pas créer à ta place

Ces trois blocs demandent des démarches administratives externes. Le code
est prêt à les recevoir, mais l'ouverture des comptes est entièrement de
ton ressort.

### WhatsApp Business API

1. Créer un compte **Meta Business** sur **business.facebook.com** →
   **Créer un compte**.
2. Dans **Paramètres de l'entreprise**, section **Comptes** →
   **Comptes WhatsApp** → **Ajouter** → suivre le flux de création d'un
   compte WhatsApp Business.
3. Meta demande une vérification d'entreprise (documents légaux de la
   société) — ce processus prend généralement plusieurs jours.
4. Une fois approuvé, tu obtiens un **numéro de téléphone WhatsApp
   Business** et des identifiants d'API (`Phone Number ID`,
   `WhatsApp Business Account ID`, un token d'accès).
5. **Reviens me voir avec ces identifiants** — j'ajouterai le code
   d'intégration à ce moment-là (envoi de rappels par WhatsApp en plus de
   l'email, section 11 du cahier des charges).

### Mobile Money (MTN, Moov...)

1. Chaque opérateur a son propre programme "API marchand" — par exemple
   **MTN MoMo API** (`momodeveloper.mtn.com`) pour MTN, ou un contact
   direct avec Moov Money pour un compte marchand.
2. Le processus typique : créer un compte développeur sur le portail de
   l'opérateur, souscrire à l'API "Collections" (encaissement), passer par
   une phase sandbox/test, puis une validation KYC (identité de
   l'entreprise) avant le passage en production.
3. Ça se fait généralement par pays et par opérateur séparément — si tu
   cibles plusieurs pays du cahier des charges (Bénin, Togo, Côte
   d'Ivoire...), prévois une démarche par pays.
4. Une fois les identifiants API obtenus (clé API, clé secrète,
   généralement un endpoint sandbox puis un endpoint production),
   reviens vers moi pour l'intégration du webhook de confirmation de
   paiement.

### Facturation des abonnements (plans payants)

1. Stripe ne traite pas nativement les paiements pour un compte basé en
   Afrique de l'Ouest en FCFA — vérifie d'abord ce point avant de choisir
   un prestataire. Des alternatives couramment utilisées dans la région :
   **CinetPay**, **Flutterwave**, **PayDunya** — chacune a son propre
   processus d'inscription marchand avec vérification d'identité.
2. Une fois un compte marchand ouvert et les clés API obtenues, je peux
   brancher un flux d'abonnement (choix du plan → paiement → mise à jour
   automatique de `user.plan` en base) à la place du changement manuel
   actuel depuis `/admin`.

---

## Checklist finale

- [ ] Code poussé sur GitHub
- [ ] Blueprint Render appliqué (3 services + 1 cron créés)
- [ ] `FRONTEND_URL` (sur habita-api) et `NEXT_PUBLIC_API_URL` (sur
      habita-app) correctement reliés
- [ ] Migrations appliquées (vérifié dans les logs de habita-api)
- [ ] Compte SMTP créé et renseigné, rappel de test reçu par email
- [ ] `CRON_SECRET` identique des deux côtés (habita-api et le cron)
- [ ] Compte Cloudinary créé et renseigné, upload de photo testé
- [ ] Mots de passe des comptes de démo changés (ou comptes supprimés)
- [ ] Tour complet effectué : créer un compte propriétaire → ajouter une
      propriété → une unité → un locataire → enregistrer un paiement →
      vérifier le tableau de bord → créer l'accès locataire → se
      connecter avec ce compte → télécharger un reçu → envoyer un message
      → signaler un problème
- [ ] Domaine personnalisé configuré (si applicable)
