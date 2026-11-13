# Déploiement — Feed Your Head

Stack cible : **GitHub → Railway (Node monolithe + volume persistant) → IONOS (DNS)**.

## Vue d'ensemble

```
git push main  →  GitHub  →  webhook  →  Railway build (Dockerfile, Node 22.23.5)
                                          • npm install
                                          • npm run build  (vite → client/dist)
                                          • node src/index.js (bootstrap → migrate → seed if empty → listen)
                                          • Volume /data   (sqlite + uploads, persistant)
                                              ↓
                            https://feedyourhead.fr  (CNAME IONOS → Railway)
```

Tout est automatique : un `git push` re-déploie. Les données (DB + uploads) survivent aux redéploiements grâce au **volume Railway**.

## Version de Node (sécurité)

La version de Node est **figée au patch près** dans le `Dockerfile` (`ARG NODE_VERSION`).
Après une mise à jour de sécurité Node.js (https://nodejs.org/en/blog/vulnerability) :

1. Mettre à jour `NODE_VERSION` dans le `Dockerfile` (vérifier que le tag `node:<version>-trixie-slim` existe sur Docker Hub)
2. Pousser → vérifier dans le log de build Railway que la ligne `FROM node:<version>-trixie-slim` porte bien la nouvelle version

⚠️ Garder une image **Debian trixie** (pas bookworm) : le binaire précompilé de `sqlite3` v6 exige glibc ≥ 2.38, bookworm n'a que 2.36 → le serveur ne démarre pas.

## Pré-requis

- Compte GitHub avec ce repo poussé sur `origin/main`
- Compte Railway (Hobby ou Pro)
- Accès à la console IONOS de `feedyourhead.fr`

## Étape 1 — Créer le projet Railway

1. https://railway.app → New Project → **Deploy from GitHub repo**
2. Sélectionner `feed-your-head`
3. Railway lit `railway.json` (builder `DOCKERFILE`) → build automatique via le `Dockerfile`
4. **Attendre que le premier build échoue ou démarre** (peu importe) — on configure le volume et les vars ensuite

## Étape 2 — Volume persistant

1. Dans le service → onglet **Volumes** → **+ Volume**
2. Mount path : `/data`
3. Taille : 1 GB (largement suffisant pour démarrer)

## Étape 3 — Variables d'environnement

Dans le service → onglet **Variables** :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/data` |
| `JWT_SECRET` | `openssl rand -hex 48` (générer une chaîne aléatoire ≥ 32 caractères) |
| `ADMIN_EMAIL` | l'adresse d'admin (utilisée pour `/admin` au premier seed) |
| `ADMIN_PASSWORD` | mot de passe fort (seed initial — change-le ensuite via `/admin`) |
| `ADMIN_NAME` | nom complet |
| `PUBLIC_ORIGIN` | `https://feedyourhead.fr` |
| `BREVO_API_KEY` | clé API Brevo (Brevo → *SMTP & API* → *API keys*) |
| `CONTACT_FROM` | **doit être une adresse vérifiée dans Brevo** (voir ci-dessous) — sinon Brevo rejette l'envoi et `/api/contact` répond 502 |
| `CONTACT_TO` | *(optionnel)* destinataire — défaut = `CONTACT_FROM` |

**Ne pas définir `PORT`** — Railway l'injecte automatiquement, `getPort()` le récupère.

> Le formulaire de contact envoie via l'**API Brevo** en HTTPS (`server/src/routes/contact.js`) — Railway bloque le SMTP sortant, donc pas de SMTP IONOS direct. Sans `BREVO_API_KEY`, l'endpoint `/api/contact` répond `email_not_configured`.
>
> **L'expéditeur est le point sensible.** Brevo refuse tout envoi dont le `sender` n'est pas une adresse vérifiée chez lui (*Expéditeurs, domaines et IP*). `CONTACT_FROM` doit donc reprendre **exactement** une adresse marquée « Vérifié » dans cette page. Le destinataire (`CONTACT_TO`), lui, n'a aucune vérification à passer : il peut rester `virginie@feedyourhead.fr`.
>
> **Cible recommandée — authentifier le domaine.** Le TXT `brevo-code:…` est déjà posé sur `feedyourhead.fr` (propriété prouvée), mais les enregistrements **DKIM manquent**, donc le domaine n'est pas authentifié et aucune adresse `@feedyourhead.fr` n'est utilisable comme expéditeur. Pour finir : Brevo → *Expéditeurs, domaines et IP* → *Domaines* → `feedyourhead.fr` → *Authentifier* → copier les enregistrements DKIM (et le DMARC proposé) dans la zone DNS IONOS. Une fois le domaine vert, ajouter `virginie@feedyourhead.fr` comme expéditeur et remettre `CONTACT_FROM` dessus.
>
> **Restriction IP : à laisser désactivée.** Brevo peut n'autoriser les appels API que depuis une liste d'IP (*SMTP et API* → bandeau « Les adresses IP non autorisées sont bloquées »). Railway n'a pas d'IP sortante fixe — elle change d'un déploiement à l'autre — donc une allowlist bloque le formulaire et finit par faire désactiver la clé par Brevo. Laisser cette restriction inactive, ou passer par une IP sortante statique (option payante Railway).
>
> **Dépannage.** `GET /api/contact/diagnostic` (connecté au back office) dit si la clé est valide, s'il reste des crédits et quels expéditeurs Brevo considère comme vérifiés. En cas d'échec, le formulaire renvoie aussi un champ `reason` : `sender_not_validated`, `api_key_rejected`, `quota_exceeded`, `account_blocked` ou `timeout`.

Cliquer **Deploy** → le service redémarre, le bootstrap :
1. crée `/data/feedyourhead.sqlite`
2. exécute les migrations
3. constate que la DB est vide → exécute le seed (admin + contenu placeholder)
4. log : `[bootstrap] seed complete`

Tester : `https://<projet>.up.railway.app/api/content` → JSON OK.

## Étape 4 — Domaine personnalisé

### Côté Railway

1. Service → onglet **Settings** → **Networking** → **Custom Domain**
2. Saisir `feedyourhead.fr` → Railway affiche un **CNAME cible** (ex. `xyz.up.railway.app`)
3. Saisir aussi `www.feedyourhead.fr` (recommandé) → Railway affiche un second CNAME

### Côté IONOS

Console IONOS → Domaines → `feedyourhead.fr` → **DNS** :

- Enregistrement **CNAME** : `www` → `xyz.up.railway.app.` (point final)
- Enregistrement **ALIAS / ANAME** (si IONOS le propose) sur l'apex `@` → même cible
  - Sinon : créer une **redirection 301** `feedyourhead.fr → https://www.feedyourhead.fr` dans IONOS, et n'utiliser que `www` côté Railway
  - Alternative : IONOS donne une **IP** pour l'enregistrement `A` ? Railway ne fournit pas d'IP fixe, donc CNAME ou redirect uniquement

Propagation DNS : 5 min à 1 h. Railway provisionne le certificat Let's Encrypt automatiquement.

## Étape 5 — Vérifications

```bash
# 1. Le site répond
curl -I https://feedyourhead.fr/
# → 200, header X-Powered-By: Express

# 2. L'API répond
curl -s https://feedyourhead.fr/api/content | jq '.sections[].type'
# → ["hero","approche","offres",…]

# 3. Connexion admin
# → ouvrir https://feedyourhead.fr/admin, se loguer avec ADMIN_EMAIL/PASSWORD
# → CHANGER LE MOT DE PASSE immédiatement (Paramètres → Utilisateurs)
```

## Workflow quotidien

### Modifier le contenu (textes, images, sections, paramètres)

→ `/admin` directement. Écrit dans SQLite sur le volume, **pas de redéploiement**.

### Modifier le code

```bash
git add -A
git commit -m "..."
git push origin main
```

Railway détecte le push → rebuild + redeploy en ~2 minutes. Les données restent intactes (volume).

### Rollback

Railway → Deployments → cliquer un déploiement précédent → **Redeploy**.

### Migrations DB

Ajouter un fichier dans `server/src/db/migrations/`. Au prochain boot, `bootstrap.js` l'applique automatiquement (`db.migrate.latest()`).

### Backups

À configurer dans un second temps. Options :
- **Railway Backups** (managed, payant)
- Cron GitHub Actions qui SSH → `sqlite3 .backup` → S3/B2
- Snapshots manuels via Railway CLI : `railway run sqlite3 /data/feedyourhead.sqlite ".backup /tmp/snap.db"`

## Importer la DB locale (optionnel)

Si tu veux pousser ta `server/data/feedyourhead.sqlite` actuelle (avec tout le contenu déjà édité) au lieu de partir d'un seed neuf :

```bash
# 1. Installer Railway CLI
npm i -g @railway/cli
railway login
railway link  # sélectionner le projet

# 2. Ouvrir un shell dans le service
railway shell

# 3. Copier le fichier (depuis ta machine, dans un autre terminal)
railway run --service <nom> -- sh -c 'cat > /data/feedyourhead.sqlite' \
  < server/data/feedyourhead.sqlite

# 4. Redémarrer le service depuis l'UI Railway
```

À faire **avant** de configurer le domaine (sinon mini-coupure).

## Mot de passe admin oublié / verrouillé

Mécanisme de reset par variable d'environnement (pas besoin d'infra mail) :

1. Railway → Variables : vérifie/ajuste `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
2. Ajoute une variable **`ADMIN_RESET=true`**
3. Le service redéploie → au boot, `bootstrap.js` :
   - si un compte avec `ADMIN_EMAIL` existe → réinitialise son mot de passe sur `ADMIN_PASSWORD`
   - sinon → crée le compte
   - logs : `[bootstrap] ADMIN_RESET: …`
4. Connecte-toi à `/admin` avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`
5. **Supprime la variable `ADMIN_RESET`** (sinon le reset rejoue à chaque déploiement)

Les identifiants courants sont toujours lisibles dans Railway → Variables (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Sécurité — checklist avant ouverture publique

- [ ] `JWT_SECRET` est une vraie chaîne aléatoire (≥ 48 chars)
- [ ] `ADMIN_PASSWORD` a été changé via `/admin` après le 1ᵉʳ login
- [ ] HTTPS effectif (Railway le gère, vérifier le cadenas)
- [ ] La page `/admin` redirige bien sur `/admin/login` si non authentifié
- [ ] Helmet CSP actif en prod (vérifier headers de réponse)
