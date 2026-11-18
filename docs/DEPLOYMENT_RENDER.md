# PJ STUDY — RENDER PRODUCTION DEPLOYMENT & READINESS BLUEPRINT

**Product:** PJ Study  
**Tagline:** Your Entire Study World, One Place.  
**Version:** 1.0.0 (Production-Ready)  
**Target Cloud:** Render + Managed PostgreSQL + Private Google Drive Storage  

---

## 1. Production Architecture Overview

```
                      [ Client Browsers & Mobile Devices (HTTPS) ]
                                            │
                                            ▼
                        [ Cloudflare / Render Edge Global CDN ]
                        (Automatic SSL/TLS 1.3 Termination)
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
     [ Frontend Static Site ]                                 [ Backend Web Service ]
     pj-study-frontend                                        pj-study-backend
     React 18 + Vite SPA                                      Node.js 20+ Express ESM
     Render Static Site (dist/)                               Render Web Service (Linux)
     SPA Rewrite: /* -> /index.html                           Port: 10000 | Reverse Proxy Trust
               │                                                         │
               └─────────────────────── HTTPS API ───────────────────────┘
                                   (/api/v1/*)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        [ Managed PostgreSQL 16 ]               [ Google Drive Cloud Storage ]
        pj-study-postgres                       Private Encrypted Vault
        Render Managed DB                       Least-Privilege OAuth 2.0
        31 Models | 7 Enums                     Streamed via Backend Only
```

---

## 2. Infrastructure as Code (`render.yaml`)

PJ Study includes a turnkey [`render.yaml`](file:///Users/piyush/Piyush/temp/PJ%20Study/render.yaml) blueprint specification for 1-click deployment.

### Service Topology:
1. **`pj-study-frontend` (Static Site)**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - SPA Fallback Route: `/*` $\to$ `/index.html`
   - Cache-Control: `public, max-age=31536000, immutable` for `/assets/*`
2. **`pj-study-backend` (Web Service)**:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node src/server.js`
   - Health Check Path: `/health/ready`
   - Auto-wires `DATABASE_URL` from `pj-study-postgres`
3. **`pj-study-postgres` (Managed Database)**:
   - PostgreSQL 16
   - Database Name: `pj_study`

---

## 3. Environment Variables Specification

### Frontend (`frontend/.env`)
| Variable | Required | Production Value / Example | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `https://pj-study-backend.onrender.com/api/v1` | Public HTTPS backend API base URL |
| `VITE_PUBLIC_APP_URL` | **Yes** | `https://pjstudy.com` | Canonical frontend domain for SEO & Open Graph |

> [!CAUTION]
> **Zero Frontend Secrets**: Never prefix sensitive keys (JWT secrets, database passwords, OAuth secrets) with `VITE_`. Only public API URLs belong in the frontend bundle.

### Backend (`backend/.env`)
| Variable | Required | Production Value / Example | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enforces HSTS, error shielding, and combined logging |
| `PORT` | **Yes** | `10000` | Port assigned by Render router |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/pj_study?sslmode=require` | PostgreSQL connection string |
| `FRONTEND_URL` | **Yes** | `https://pjstudy.com,https://pj-study-frontend.onrender.com` | Allowed CORS origins (comma-separated supported) |
| `PUBLIC_APP_URL` | **Yes** | `https://pjstudy.com` | Canonical public application URL |
| `JWT_ACCESS_SECRET` | **Yes** | `[256-bit entropy string]` | Signing key for short-lived access tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifespan |
| `REFRESH_TOKEN_EXPIRES_IN`| No | `7d` | Database refresh session lifespan |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN`| No | `15m` | Expiration for password recovery tokens |
| `EMAIL_VERIFICATION_TOKEN_EXPIRES_IN`| No | `24h` | Expiration for email verification tokens |
| `STORAGE_PROVIDER` | **Yes** | `google_drive` | Active cloud storage provider (`google_drive` \| `local`) |
| `MAX_FILE_SIZE_MB` | No | `25` | Maximum upload document size ceiling |
| `GOOGLE_CLIENT_ID` | **Yes** | `***.apps.googleusercontent.com` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | **Yes** | `***` | Google Cloud OAuth Client Secret |
| `GOOGLE_REFRESH_TOKEN` | **Yes** | `1//04***` | Long-lived OAuth refresh token |
| `GOOGLE_DRIVE_FOLDER_ID`| **Yes** | `1wT2YCcXkdDR6KSg06sncFM8m3w3PrK5c` | Dedicated private folder ID in Google Drive |
| `GOOGLE_REDIRECT_URI` | **Yes** | `https://pj-study-backend.onrender.com/api/v1/storage/google/oauth/callback` | Authorized OAuth redirect endpoint |
| `EMAIL_PROVIDER` | No | `console` \| `smtp` \| `sendgrid` \| `resend` | Active transactional email transport |
| `ENABLE_SWAGGER` | No | `false` | Swagger disabled by default in production |

---

## 4. Google Cloud Platform & Private Google Drive Setup

PJ Study uses a private Google Drive backend to store uploaded academic PDF manuscripts. Files are never exposed publicly on Google Drive; all previews and downloads are authorized and streamed through Express.

### Step-by-Step Google Cloud Configuration:
1. **Create or Select Project**:
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a project named `PJ Study Production`.
2. **Enable Google Drive API**:
   - Go to **APIs & Services > Library**.
   - Search for **Google Drive API** and click **Enable**.
3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Select User Type: **External** (or Internal for Google Workspace).
   - App Name: `PJ Study`.
   - User Support Email & Developer Contact: Your administrator email.
   - Scopes: Add `https://www.googleapis.com/auth/drive.file` (least-privilege: allows app to access only files it creates).
   - **Publishing Status**: Once tested, click **Publish App** to switch from "Testing" to "In production".
     > [!IMPORTANT]
     > While in "Testing" status, Google OAuth refresh tokens expire after **7 days**, requiring re-authorization. Switching the Consent Screen to **"In production"** prevents refresh tokens from expiring.
4. **Create OAuth 2.0 Client Credentials**:
   - Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `PJ Study Backend Production`.
   - Authorized JavaScript Origins:
     - `https://pj-study-backend.onrender.com`
     - `https://pjstudy.com`
   - Authorized Redirect URIs:
     - `https://pj-study-backend.onrender.com/api/v1/storage/google/oauth/callback`
     - `http://localhost:5001/api/v1/storage/google/oauth/callback` (for local maintenance)
5. **Generate Long-Lived Refresh Token**:
   - Run the included CLI authorization script:
     ```bash
     npm run gdrive:auth
     ```
   - Open the generated Google consent URL in your browser, log in with the storage owner Google account, and grant access.
   - Copy the output `GOOGLE_REFRESH_TOKEN` into Render environment variables.
6. **Dedicated Google Drive Folder**:
   - In Google Drive, create a folder named `PJ Study Notes Production`.
   - Copy the folder ID from the URL (the string after `/folders/`).
   - Set `GOOGLE_DRIVE_FOLDER_ID` in Render environment variables.

---

## 5. PostgreSQL Production Setup & Migration Safety

### Database Migration Command:
When deploying to Render, the database schema must be initialized using Prisma's non-destructive production deploy command:

```bash
npx prisma migrate deploy
```

> [!WARNING]
> **Strict Migration Invariants**:
> - NEVER run `prisma migrate reset` in production (destroys data).
> - NEVER run `prisma db push --force-reset` (destroys tables).
> - `prisma migrate deploy` executes only pending SQL migrations in [`backend/prisma/migrations/`](file:///Users/piyush/Piyush/temp/PJ%20Study/backend/prisma/migrations/) inside an atomic transaction.

---

## 6. Deployment Procedure (Step-by-Step)

### Option A: Render Blueprint (Recommended)
1. Push repository changes to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Select your `PJ Study` repository.
4. Render detects `render.yaml` and parses the 3 services (`pj-study-frontend`, `pj-study-backend`, `pj-study-postgres`).
5. Provide the required secrets in the Render dashboard:
   - `VITE_API_BASE_URL`: `https://pj-study-backend.onrender.com/api/v1`
   - `FRONTEND_URL`: `https://pj-study-frontend.onrender.com`
   - Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`)
6. Click **Apply Blueprint**.

### Option B: Manual Service Creation
1. **Database**: Click **New > PostgreSQL**, select Name: `pj-study-postgres`, Plan: Starter, Version: 16.
2. **Backend**: Click **New > Web Service**, connect repo, set Root Directory: `backend`, Build Command: `npm install && npx prisma generate`, Start Command: `node src/server.js`, Health Check: `/health/ready`. Add environment variables.
3. **Frontend**: Click **New > Static Site**, connect repo, set Root Directory: `frontend`, Build Command: `npm install && npm run build`, Publish Directory: `dist`. Add rewrite rule `/*` $\to$ `/index.html`. Add `VITE_API_BASE_URL`.

---

## 7. Production Smoke Test Checklist

Execute these 14 non-destructive checks immediately following deployment:

| # | Check | Verification Method | Expected Result |
| :-: | :--- | :--- | :--- |
| 1 | **Frontend Load** | Navigate to `https://<frontend-url>` | Homepage renders without blank screen or console errors |
| 2 | **Backend Health** | `GET /health` | HTTP 200 `{"status": "healthy"}` |
| 3 | **Readiness Probe** | `GET /health/ready` | HTTP 200 `{"status": "ready", "database": "connected"}` |
| 4 | **Liveness Probe** | `GET /health/live` | HTTP 200 `{"status": "alive"}` |
| 5 | **API Documentation** | `GET /api-docs` | HTTP 403 `DOCS_DISABLED` (enforces production security) |
| 6 | **CORS Enforcement**| Request from unauthorized origin | HTTP 500 / CORS error (unauthorized origin rejected) |
| 7 | **Authentication** | Login with `admin@portal.com` | HTTP 200, JWT returned, session cookie set |
| 8 | **Scholar Profile** | `GET /api/v1/auth/me` with Bearer token | Profile returns with authentic role |
| 9 | **Scholar Upload Guard**| Scholar attempts note upload | HTTP 403 `UPLOAD_FORBIDDEN` |
| 10 | **Notes Discovery**| `GET /api/v1/notes/explore` | Returns authentic notes (`test` and `test2`) |
| 11 | **Document Preview**| Click "Preview" on Note `test2` | Stream loads PDF from Google Drive via backend proxy |
| 12 | **Document Download**| Click "Download" on Note `test` | Streams local file with correct filename and headers |
| 13 | **Admin Dashboard**| Login as `admin@portal.com` | Admin workspace loads real metrics |
| 14 | **Zero Mutation** | Query database row counts | User count = 4, Note count = 2 (No automated rows generated) |

---

## 8. Rollback & Disaster Recovery Strategy

### Scenario 1: Failed Frontend Deployment
1. Go to **Render Dashboard > pj-study-frontend > Deploys**.
2. Select the previous stable deploy.
3. Click **Rollback to this deploy**.
4. Recovery Time: **< 1 minute**.

### Scenario 2: Failed Backend Deployment
1. Go to **Render Dashboard > pj-study-backend > Deploys**.
2. Select the previous stable commit.
3. Click **Rollback to this deploy**.
4. Recovery Time: **< 2 minutes**.

### Scenario 3: Database Rollback (PostgreSQL to MySQL)
If critical issues arise with PostgreSQL after production cutover:
1. Revert `DATABASE_URL` in Render environment to point to the MySQL database.
2. Run [`npm run db:rollback`](file:///Users/piyush/Piyush/temp/PJ%20Study/backend/scripts/rollback-to-mysql.js):
   ```bash
   cd backend && node scripts/rollback-to-mysql.js
   ```
3. Restart the backend service. MySQL remains untouched and ready to serve immediately.

### Database Backup & Recovery Plan:
- **Render PostgreSQL Starter ($7/mo)**: Automatic daily backups retained for 7 days. Restore via Render Dashboard in 1-click.
- **Logical Point-in-Time Snapshots**:
  ```bash
  # Take instant manual snapshot
  npm run db:backup
  # Or via pg_dump
  pg_dump "$DATABASE_URL" -F c -b -v -f pj_study_prod_$(date +%Y%m%d_%H%M%S).dump
  ```
- **Recovery Point Objective (RPO)**: $\le 24\text{ hours}$ (automated) / $\le 15\text{ minutes}$ (with manual pre-deploy snapshot).
- **Recovery Time Objective (RTO)**: $\le 10\text{ minutes}$ to restore database from snapshot.

---

## 9. Infrastructure Cost Estimation (Render)

| Component | Service | Tier / Plan | Monthly Cost | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Frontend** | Render Static Site | **Free** | \$0.00 | 100 GB bandwidth / month included |
| **Backend** | Render Web Service | **Starter** | \$7.00 | 512 MB RAM, 0.5 CPU, 24/7 uptime (no cold starts) |
| **Database** | Render Managed PostgreSQL | **Starter** | \$7.00 | 1 GB SSD, automated daily backups, 7-day retention |
| **Storage** | Google Drive | **Standard** | \$0.00 | 15 GB free per Google Account |
| **SSL/TLS** | Render Custom Domains | **Free** | \$0.00 | Managed Let's Encrypt certificates |
| **Total** | | | **\$14.00 / mo** | Production-grade high availability |

*(Note: Free tiers exist on Render for testing, but PostgreSQL free expires after 30 days and backend spins down when idle. The $14/mo Starter configuration is recommended for production reliability).*
