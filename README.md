# ⛪ ChurchHub — Gestion d'église

Application complète de gestion d'église : **ouvriers & présences**, **départements & fonctions**, **trésorerie** (dîmes, offrandes, caisses, dépenses), **IAM** (utilisateurs, rôles, permissions) et **audit**.

- **Backend** : Django 5 + Django REST Framework + JWT, PostgreSQL
- **Frontend** : Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion
- **Base de données** : PostgreSQL 16 (via Docker)

---

## 🧱 Architecture

```
ChurchHub/
├── backend/                 # API Django REST
│   ├── config/              # settings, urls, wsgi/asgi
│   ├── apps/
│   │   ├── core/            # base (timestamps, dashboard, profil église)
│   │   ├── accounts/        # IAM : User, Role, Permission, JWT
│   │   ├── departments/     # départements + fonctions
│   │   ├── workers/         # ouvriers, présences, événements, tâches
│   │   ├── treasury/        # caisses, dîmes, offrandes, dépenses, transactions
│   │   └── audit/           # journal d'audit automatique
│   ├── manage.py
│   └── requirements.txt
├── frontend/                # Application Next.js
└── docker-compose.yml       # PostgreSQL
```

---

## 🚀 Démarrage rapide

### 1. Base de données (PostgreSQL via Docker)

```bash
docker compose up -d
```

> PostgreSQL est exposé sur le port hôte **5544** (pour éviter tout conflit avec une instance locale). Identifiants : `churchhub` / `churchhub`.

### 2. Backend (Django)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

python manage.py migrate
python manage.py seed            # permissions, rôles, admin + données de démo

python manage.py runserver
```

API disponible sur **http://127.0.0.1:8000/api/** — documentation interactive sur **http://127.0.0.1:8000/api/docs/**

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Interface sur **http://localhost:3000**

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@churchhub.local` | `admin123` |
| Pasteur principal | `pasteur@churchhub.local` | `demo123` |
| Trésorier | `tresorier@churchhub.local` | `demo123` |
| Chef de département | `chef@churchhub.local` | `demo123` |
| Secrétaire | `secretaire@churchhub.local` | `demo123` |

---

## 🔐 Modèle de permissions (RBAC)

Chaque utilisateur possède un ou plusieurs **rôles**, chaque rôle regroupe des **permissions** par module :

| Module | Permissions |
|--------|-------------|
| Tableau de bord | `dashboard.view` |
| IAM | `iam.view`, `iam.manage` |
| Départements | `departments.view`, `departments.manage` |
| Ouvriers | `workers.view`, `workers.manage`, `workers.attendance` |
| Trésorerie | `treasury.view`, `treasury.manage`, `treasury.caisse_manage`, `treasury.expense_approve` |
| Audit | `audit.view` |

---

## 🌐 Points d'API principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login/` | Connexion (retourne JWT + profil) |
| POST | `/api/auth/refresh/` | Rafraîchir le token |
| GET | `/api/auth/me/` | Profil courant |
| GET | `/api/dashboard/stats/` | Statistiques agrégées |
| CRUD | `/api/iam/users/`, `/api/iam/roles/` | Gestion IAM |
| CRUD | `/api/departments/`, `/api/functions/` | Départements |
| CRUD | `/api/workers/`, `/api/events/`, `/api/attendances/`, `/api/tasks/` | Ouvriers |
| CRUD | `/api/caisses/`, `/api/transactions/`, `/api/offering-types/` | Trésorerie |
| GET | `/api/transactions/summary/` | Synthèse financière |
| GET | `/api/audit/logs/` | Journal d'audit |

---

## 🛠️ Variables d'environnement

- **Backend** : voir `backend/.env` (copié depuis `.env.example`)
- **Frontend** : `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`

---

## 🚀 Déploiement sur Render

Le projet inclut un **Blueprint** `render.yaml` qui provisionne automatiquement 3 composants : base **PostgreSQL**, **API Django** (gunicorn + WhiteNoise), **frontend Next.js**.

### Prérequis
- Un compte [Render](https://render.com)
- Le code poussé sur un dépôt **GitHub** (ou GitLab)

### 1. Préparer le dépôt Git (à la racine `ChurchHub/`)
Le frontend a été généré avec son propre dossier `.git` : supprimez-le pour un mono-dépôt propre.

```bash
# Windows
rmdir /s /q frontend\.git
# macOS / Linux : rm -rf frontend/.git

git init
git add .
git commit -m "ChurchHub : application complète + blueprint Render"
git branch -M main
git remote add origin https://github.com/<votre-compte>/churchhub.git
git push -u origin main
```

### 2. Déployer le Blueprint
1. Render → **New +** → **Blueprint**.
2. Connectez le dépôt `churchhub`.
3. Render détecte `render.yaml` et propose les 3 services → **Apply**.
4. Le build exécute automatiquement `collectstatic`, `migrate` puis `seed` (données de démo + compte admin).

### 3. Vérifier les URL (important)
Le blueprint suppose `churchhub-api.onrender.com` et `churchhub-web.onrender.com`. Si Render attribue un autre nom, ajustez ces variables d'environnement puis redéployez :
- Service **churchhub-web** : `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MEDIA_URL` → URL réelle de l'API
- Service **churchhub-api** : `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` → URL réelle du frontend

L'application est ensuite accessible sur l'URL du service **churchhub-web**. Connexion : `admin@churchhub.local` / `admin123`.

> **Plan gratuit Render** : les services s'endorment après inactivité (premier accès lent ~30 s), la base PostgreSQL gratuite expire après 90 jours, et les fichiers uploadés ne persistent pas (disque éphémère — brancher un stockage type S3/Cloudinary pour une vraie prod).
