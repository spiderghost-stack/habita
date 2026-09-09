# Déployer HaBiTa sur Render

Trois services Render : une base PostgreSQL, un service web pour l'API, un
service web pour le frontend Next.js. Deux façons de faire : le blueprint
(`render.yaml`, plus rapide) ou la création manuelle service par service
(plus de contrôle, utile si le blueprint échoue sur un détail).

Dans les deux cas, ton code doit être sur GitHub (ou GitLab/Bitbucket) —
Render déploie depuis un dépôt Git, pas depuis un zip.

## Option A — via le blueprint (`render.yaml`)

1. Pousse ce dépôt sur GitHub, avec `render.yaml` à la racine.
2. Sur [render.com](https://render.com), *New* → *Blueprint*.
3. Sélectionne le dépôt. Render lit `render.yaml` et te propose de créer les
   trois ressources (`habita-db`, `habita-api`, `habita-app`) en une fois.
4. Vérifie les noms proposés, valide. Render crée d'abord la base, puis
   construit les deux services.
5. Une fois les deux services en ligne, mets à jour deux variables qui se
   référencent l'une l'autre (voir section "URLs croisées" plus bas) :
   Render attribue les URLs définitives seulement après la première
   création, donc les valeurs placeholder du `render.yaml`
   (`habita-api.onrender.com`, `habita-app.onrender.com`) doivent être
   corrigées si Render a choisi un nom légèrement différent.

## Option B — création manuelle

### 1. Base de données

- *New* → *PostgreSQL*.
- Nom : `habita-db`, plan Free (ou payant si tu veux des sauvegardes
  automatiques).
- Une fois créée, copie l'**Internal Database URL** (pas l'externe — le
  service backend et la base seront dans le même réseau Render, la connexion
  interne est plus rapide et ne sort pas sur internet).

### 2. Backend (`habita-api`)

- *New* → *Web Service*, connecte le dépôt GitHub.
- **Root Directory** : `backend`
- **Runtime** : Node
- **Build Command** : `npm install && npm run build && npx prisma migrate deploy`
- **Start Command** : `npm start`
- **Plan** : Free pour commencer (se met en veille après 15 min d'inactivité —
  la première requête après une veille peut prendre 30-60 secondes).
- Variables d'environnement (onglet *Environment*) :
  - `DATABASE_URL` = l'URL interne copiée à l'étape 1
  - `JWT_SECRET` = une valeur générée (`openssl rand -hex 32` en local, ou
    utilise le bouton *Generate* de Render)
  - `JWT_EXPIRES_IN` = `7d`
  - `NODE_ENV` = `production`
  - `FRONTEND_URL` = laisse un placeholder pour l'instant (`https://TBD`),
    tu le corrigeras à l'étape 4
- Déploie. Render construit l'image et exécute la migration Prisma au
  premier build — surveille les logs, c'est là que tu verras si
  `DATABASE_URL` est mal renseignée.

### 3. Frontend (`habita-app`)

- *New* → *Web Service*, même dépôt.
- **Root Directory** : `frontend`
- **Runtime** : Node
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm start`
- Variable d'environnement :
  - `NEXT_PUBLIC_API_URL` = `https://<nom-de-ton-service-backend>.onrender.com/api/v1`
    (visible dans l'onglet *Settings* du service backend une fois créé)

`NEXT_PUBLIC_API_URL` est lue au moment du build par Next.js, pas au
démarrage : si tu la changes après coup, il faut redéployer (pas juste
redémarrer) le service frontend pour qu'elle soit prise en compte.

### 4. Reboucler les URLs

Une fois les deux services en ligne, chacun a une URL `*.onrender.com`
définitive :

- retourne dans le service **backend** → *Environment* → mets à jour
  `FRONTEND_URL` avec l'URL réelle du frontend, puis redéploie.
- si l'URL du backend est différente de ce que tu avais mis dans
  `NEXT_PUBLIC_API_URL`, corrige-la côté frontend et redéploie aussi.

Sans cette étape, le navigateur du locataire ou du propriétaire bloquera les
requêtes avec une erreur CORS — le symptôme typique est un tableau de bord
qui reste bloqué sur "Chargement…" sans message d'erreur explicite.

## Rappels de loyer automatiques (cron)

Le blueprint crée un troisième service, `habita-rappels-quotidiens`, de type
*Cron Job* Render : il appelle chaque jour `POST /notifications/run-global`
sur le backend avec le secret partagé `CRON_SECRET`.

Deux choses à faire toi-même après le déploiement :

1. **Copier `CRON_SECRET`** de `habita-api` vers `habita-rappels-quotidiens`
   (même valeur des deux côtés — le blueprint ne le fait pas automatiquement
   pour un cron, d'où `sync: false` dans `render.yaml`).
2. **Configurer un fournisseur SMTP** sur `habita-api` (`SMTP_HOST`,
   `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) — sans ça, le cron s'exécute et
   marque les rappels comme traités dans les logs, mais aucun email ne part
   réellement. Voir `MANUAL_STEPS.md`.

L'horaire par défaut (`0 7 * * *`, 7h UTC) est arbitraire — ajuste-le à
l'heure locale de tes utilisateurs. Le plan Free de Render peut retarder
l'exécution d'un cron de quelques minutes ; ce n'est pas un problème pour un
rappel quotidien.

Si tu préfères ne pas gérer un service Render supplémentaire, un service
externe gratuit comme cron-job.org peut appeler la même URL avec le même
en-tête — dans ce cas, supprime le bloc `type: cron` du `render.yaml` et
configure l'appel côté cron-job.org à la place.

## Vérifier que ça marche

1. Ouvre l'URL du frontend, tu dois arriver sur `/login`.
2. Crée un compte via *Créer un compte propriétaire*.
3. Ajoute une propriété, une unité, un locataire, enregistre un paiement.
4. Vérifie que le tableau de bord reflète bien ces chiffres.

Si l'étape 2 échoue avec une erreur réseau : vérifie `NEXT_PUBLIC_API_URL`
côté frontend et `FRONTEND_URL` côté backend en premier — c'est la cause la
plus fréquente à ce stade.

## Domaine personnalisé (optionnel)

Render permet d'attacher un domaine (`app.habita.bj` par exemple) sur
n'importe quel service web, gratuitement, avec certificat SSL automatique —
onglet *Settings* → *Custom Domains* sur chaque service. Si tu fais ça,
n'oublie pas de refaire l'étape 4 (reboucler les URLs) avec les nouveaux
domaines.
