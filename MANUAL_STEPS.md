# Ce qu'il reste à faire à la main

Le code n'est pas déployable tel quel. Voici, dans l'ordre, tout ce qui
dépend de toi et ne peut pas être généré à l'avance.

## 1. Base de données

Je n'ai pas de base PostgreSQL à te fournir. Deux options :

- en local : installer PostgreSQL, créer une base `habita`, et renseigner
  `DATABASE_URL` dans `backend/.env`.
- sur Render : créer une base PostgreSQL managée (voir `DEPLOY_RENDER.md`),
  Render te donne directement la chaîne de connexion à copier.

Une fois `DATABASE_URL` renseignée, lance `npx prisma migrate dev` (en local)
ou laisse `npx prisma migrate deploy` s'exécuter au build sur Render — c'est
déjà dans la commande de build du `render.yaml`.

## 2. Secrets

- `JWT_SECRET` : génère une valeur aléatoire, ne réutilise jamais celle de
  `.env.example`. En local : `openssl rand -hex 32`. Sur Render, le blueprint
  la génère automatiquement (`generateValue: true`).
- Ne commite jamais de fichier `.env` — les `.gitignore` des deux dossiers
  l'excluent déjà, mais vérifie avant ton premier `git push`.

## 3. Premier compte

Le seed (`npm run prisma:seed`) crée un compte de démonstration
(`demo@habita.app` / `password123`) avec une propriété, trois unités, un
locataire, un paiement, une dépense et un contrat. Utile pour tester
rapidement, mais change ce mot de passe ou supprime ce compte avant
d'inviter de vrais utilisateurs — il est documenté en clair dans ce dépôt.

Pour un compte réel, passe par la page `/register` du frontend.

## 4. Accès à l'espace locataire

Il n'y a pas de service d'envoi d'email branché dans ce MVP. Créer un accès
locataire (bouton "Créer l'accès" sur sa fiche) génère un mot de passe
temporaire qui s'affiche une seule fois à l'écran — c'est à toi de le
transmettre au locataire (SMS, appel, WhatsApp manuel). Si tu fermes cette
fenêtre sans le noter, il faut recommencer ("Réinitialiser le mot de
passe") : rien ne permet de le retrouver après coup, le mot de passe n'est
jamais stocké en clair côté serveur.

## 5. Rappels de loyer par email

Pas d'email n'est envoyé tant que `SMTP_HOST`, `SMTP_USER` et `SMTP_PASS`
ne sont pas renseignés (en local dans `.env`, sur Render dans les
variables d'environnement de `habita-api`). N'importe quel fournisseur
SMTP standard fonctionne — Brevo (ex-Sendinblue) a un plan gratuit
suffisant pour démarrer, Mailgun aussi. Sans ces variables, le job de
rappels tourne quand même (déclenché manuellement depuis le tableau de
bord ou par le cron sur Render) mais se contente d'écrire dans les logs
au lieu d'envoyer — pratique pour vérifier que la logique fonctionne
avant de brancher un vrai compte email.

Le cron quotidien lui-même (`habita-rappels-quotidiens` dans
`render.yaml`) a besoin que tu copies `CRON_SECRET` depuis `habita-api`
vers ce service — détails dans `DEPLOY_RENDER.md`.

## 6. Upload de photos (Cloudinary)

Sans `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` et
`CLOUDINARY_API_SECRET` renseignés côté backend, l'upload de photo dans un
signalement échoue avec une erreur claire (503) plutôt qu'un plantage
silencieux. Étapes de création du compte détaillées dans `guide.md`.

## 7. Plans d'abonnement et rôle administrateur

Il n'y a pas de paiement réel branché : le plan d'un compte (Gratuit,
Starter, Pro, Business) se change à la main depuis la page `/admin`, qui
n'est visible que par un compte de rôle `ADMIN`. Le seed en crée un
(`admin@habita.app` / `password123`) — change ce mot de passe avant tout
usage réel, comme les autres comptes de démo. Sans compte admin, personne
ne peut changer le plan ou le rôle d'un autre utilisateur : crée-en un
toi-même via `/register` puis change son rôle directement en base
(`UPDATE users SET role = 'ADMIN' WHERE email = '...'`) si tu perds
l'accès au compte de démo.

## 8. CORS et URLs croisées

Le backend n'accepte que les requêtes venant de `FRONTEND_URL` (voir
`backend/src/app.ts`). Si tu changes le nom de domaine du frontend sur
Render, il faut mettre à jour cette variable côté backend — sinon toutes les
requêtes échoueront avec une erreur CORS silencieuse (visible seulement dans
la console du navigateur).

De même, `frontend/.env` doit pointer vers l'URL réelle du backend
(`NEXT_PUBLIC_API_URL`), avec le suffixe `/api/v1`.

## 9. Ce que je n'ai pas testé en conditions réelles

J'ai relu le code et fait un contrôle de types partiel (le bac à sable dans
lequel je travaille n'a pas accès aux serveurs de Prisma pour générer le
client complet — ce sera résolu automatiquement au premier `npm install` sur
ta machine ou sur Render, qui ont un accès réseau normal). Ce que ça veut
dire concrètement : je n'ai pas pu lancer l'application ni cliquer dedans.
Avant de la montrer à un vrai propriétaire, prévois toi-même un tour complet :
créer un compte, ajouter une propriété, une unité, un locataire, enregistrer
un paiement, vérifier que le tableau de bord se met à jour.

## 10. Limite du statut "en retard"

Voir la dernière section de `ROADMAP.md` — le calcul actuel ne regarde que le
mois en cours, pas les arriérés cumulés. Utilisable pour une démo, pas encore
pour un vrai suivi de trésorerie sur plusieurs mois.

## 11. Design du logo

J'ai repris le PNG que tu as fourni tel quel dans `frontend/public/logo.png`.
Si tu as une version vectorielle (SVG) ou une version fond transparent plus
légère, ça vaut le coup de la substituer — le PNG actuel pèse environ 220 Ko
et n'est affiché qu'en 32 à 72 px, donc plus lourd que nécessaire pour un
logo de barre latérale.

## 12. Ce que je n'ai pas construit et que tu devras décider

- politique de mots de passe (le minimum actuel est 8 caractères, sans
  exigence de complexité — à durcir si tu vises un usage professionnel)
- le champ photo d'un signalement n'accepte qu'un lien externe, pas un
  vrai fichier uploadé — un locataire sans moyen d'héberger une image
  (Google Photos, WhatsApp web, etc.) ne pourra pas joindre de photo tant
  que Cloudinary n'est pas branché
- la cadence des rappels de retard (premier jour, puis tous les 7 jours) est
  un choix arbitraire de ma part pour éviter le spam — à ajuster si tu
  observes qu'elle ne correspond pas à ce que veulent tes utilisateurs
- le mot de passe temporaire généré pour l'accès locataire n'expire pas et
  n'oblige pas à en choisir un nouveau à la première connexion — le
  locataire peut le changer lui-même depuis `/profile`, mais rien ne l'y
  pousse activement
- durée de vie du token JWT (7 jours par défaut) et ce qui se passe à
  expiration côté frontend (pour l'instant : redirection vers /login, pas de
  rafraîchissement automatique)
- politique de sauvegarde de la base Render (le plan gratuit ne fait pas de
  sauvegarde automatique — à vérifier avant de stocker de vraies données de
  locataires)
