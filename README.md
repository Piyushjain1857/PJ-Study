# PJ Study

> **Tagline:** Your Entire Study World, One Place.  
> **Platform Version:** 1.0.0 (Production-Ready)  
> **Status:** Production Release Candidate (Candidate Commit `60b04d3`)  
> **License:** [Academic Open License](file:///Users/piyush/Piyush/temp/PJ%20Study/LICENSE)

PJ Study is an enterprise-grade academic manuscript discovery, review, and study platform designed for higher education students, faculty, and administrators. It empowers scholars to search, explore, preview, download, and organize curriculum-aligned lecture notes, past exam papers, and study materials within an editorial, distraction-free environment.

---

## 1. System Architecture & Technology Stack

PJ Study is built as a modular monorepo adhering strictly to clean architecture, zero-data-loss database invariants, and defense-in-depth security:

```
                                [ Web & Mobile Clients (PWA) ]
                                              │
                                              ▼
                               [ Render Global Edge Network ]
                             (Automatic SSL/TLS 1.3 Termination)
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         [ Frontend Static Site ]                            [ Backend Web Service ]
         React 18 + Vite SPA                                 Node.js 20+ Express ESM
         Progressive Web App (PWA)                           Port: 10000 | Reverse Proxy Trust
         Vanilla CSS Design System                           RESTful /api/v1 + Swagger Docs
                    │                                                   │
                    └─────────────────── API Calls ─────────────────────┤
                                                                        ▼
                                                   ┌────────────────────┴────────────────────┐
                                                   ▼                                         ▼
                                       [ PostgreSQL 16 Database ]             [ Private Google Drive Storage ]
                                       Prisma ORM (Connection Pool)          OAuth 2.0 Streaming Proxy
```

### Technology Highlights

- **Frontend (`frontend/`):**
  - **Framework:** React 18 + Vite (Production build: ~713ms)
  - **Language:** JavaScript ES6+ (No TypeScript, preserving pure ES modules)
  - **Styling:** Vanilla CSS3 Design System with CSS custom properties (no Tailwind, Bootstrap, or CSS-in-JS overhead)
  - **Typography & Aesthetics:** Editorial academic direction (Instrument Serif + Inter font family)
  - **Progressive Web App (PWA):** Workbox runtime caching, offline fallback, web app manifest, and background sync
  - **State Management:** React Context (`AuthContext`, `ThemeContext`) with in-memory access tokens
  - **Networking:** Axios with automated silent token refresh and cookie transport credentials

- **Backend (`backend/`):**
  - **Runtime:** Node.js 20+ (ES Modules: `"type": "module"`)
  - **Framework:** Express.js 4
  - **Database:** PostgreSQL 16 + Prisma ORM `6.19.3`
  - **Architecture:** Layered Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Prisma Client
  - **Security:** Helmet CSP, Strict-Transport-Security (HSTS), CORS origin allowlists, Express Rate Limit, Bcrypt password hashing (salt 12), SHA-256 token hashing
  - **File Storage:** Private Google Drive Cloud Storage (OAuth 2.0 streaming proxy) with local disk fallback
  - **Documentation:** OpenAPI 3.0.3 specification with interactive Swagger UI (`/api-docs`)

---

## 2. Role-Based Access Control (RBAC) Architecture

PJ Study incorporates a strict, defense-in-depth 3-tier Role-Based Access Control matrix to maintain academic integrity and prevent unauthorized content creation:

| Capability / Resource | Scholar (`STUDENT`) | Administrator (`ADMIN`) | Platform Owner (`SUPER_ADMIN`) |
| :--- | :---: | :---: | :---: |
| **Browse & Search Published Notes** | ✓ | ✓ | ✓ |
| **Document Preview & Streaming** | ✓ | ✓ | ✓ |
| **Download PDF Manuscripts** | ✓ | ✓ | ✓ |
| **Personal Bookmarks & Study Collections** | ✓ | ✓ | ✓ |
| **Upload Notes & Manuscripts** | ✕ *(Forbidden 403)* | ✓ | ✓ |
| **Approve / Reject Submissions** | ✕ | ✓ | ✓ |
| **Academic Taxonomy Management** | ✕ | ✕ | ✓ |
| **User & Staff Governance** | ✕ | ✕ | ✓ |
| **Visual Platform Builder & CMS** | ✕ | ✕ | ✓ |
| **Audit Compliance Logs** | ✕ | ✕ | ✓ |

> [!IMPORTANT]
> **Data Creation Invariant:** Scholars (`STUDENT`) are strictly prohibited from uploading manuscripts (`POST /api/v1/notes` returns HTTP 403 `UPLOAD_FORBIDDEN`). Only verified `ADMIN` and `SUPER_ADMIN` accounts can author or publish notes.

---

## 3. Core Platform Capabilities

### 3.1 Notes Discovery, Preview & Streaming
- **Taxonomic Filtering:** Notes can be filtered by University, School, Course, Semester, Subject, and Category.
- **Fast Search:** Indexed full-text search across note titles, descriptions, and subject codes.
- **Document Streaming Proxy:** Manuscripts are streamed securely via Express `/api/v1/notes/:id/preview` and `/api/v1/notes/:id/download` without exposing storage keys or cloud URLs.
- **Study Collections & Binders:** Scholars can organize notes into custom study binders (`/api/v1/collections`).

### 3.2 Visual Website Builder & Platform Control Suite
The Super Admin Control Center provides runtime visual customization without code deployment:
- **Page Configurations:** Schema-driven draft and published layouts for Homepage, Scholar Dashboard, and Admin Dashboard.
- **Platform Themes:** Dynamic CSS design token overrides (colors, radius, spacing, shadows) scoped to `PUBLIC`, `SCHOLAR`, `ADMIN`, and `SUPER_ADMIN`.
- **Navigation Hierarchies:** Customizable sidebar and header items.
- **CMS Content Blocks:** Manageable announcements, alerts, and FAQs.
- **Audit Snapshots & Rollback:** Every configuration change creates an immutable snapshot with 1-click restore.

### 3.3 Private Google Drive Cloud Storage
- **Isolated OAuth Scope:** Configured with `drive.file` scope only (grants access strictly to files created by the application).
- **Automated Token Refresh:** Refreshes OAuth access tokens in-memory using offline refresh credentials.
- **Zero URL Exposure:** Storage files remain completely private in a dedicated Google Drive folder; users never see Google Drive URLs.

### 3.4 Progressive Web App (PWA) & Offline Support
- **Workbox Service Worker:** Automatic precaching of 84 static assets (~1.65 MB).
- **Runtime Caching:** Cache-first strategy for static assets; network-first with offline fallback for study catalog pages.
- **Installable:** Manifest conforms to PWA installability requirements with adaptive SVG icons.

### 3.5 SEO & Web Discovery Engine
- **Server-Rendered Discovery:** Dynamic `/sitemap.xml` and `/robots.txt` generated directly from active database taxonomy.
- **Structured Data:** JSON-LD schema markup (`EducationalResource`, `Course`, `LearningResource`) on public note pages.
- **Meta Directives:** Canonical URLs, Open Graph preview tags, and preconnect resource hints.

---

## 4. API Endpoints Overview (`/api/v1`)

PJ Study provides a fully documented RESTful API conforming to OpenAPI 3.0.3:

| Module | Route Prefix | Access | Primary Functions |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/api/v1/auth` | Public / Cookie | Register, login, refresh rotation, logout, verify email, reset password |
| **Notes Catalog** | `/api/v1/notes` | Mixed | Browse, filter, search, preview, stream download, review notes |
| **Collections** | `/api/v1/collections` | Authenticated | Create, update, view, and organize personal study collections |
| **Dashboard** | `/api/v1/dashboard` | Scholar | Student learning metrics, recent views, recommended notes |
| **Recommendations**| `/api/v1/recommendations`| Scholar | Academic curriculum matching and peer discovery |
| **Academics** | `/api/v1/academics` | Mixed | Universities, schools, courses, semesters, subjects taxonomy |
| **Admin Workspace**| `/api/v1/admin-workspace`| Admin / Owner | Moderation queue, submission history, reports management |
| **Platform Config**| `/api/v1/admin/config` | Super Admin | CMS blocks, themes, navigation, page layouts, snapshot rollback |
| **Health Checks** | `/health`, `/health/ready` | Public | Process liveness and PostgreSQL database readiness checks |
| **API Explorer** | `/api-docs` | Public / Dev | Interactive OpenAPI 3.0.3 Swagger documentation |

---

## 5. Directory Structure

```
PJ Study/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow (Build & Test)
├── docs/                        # Operations & Deployment Documentation
│   ├── DEPLOYMENT_RENDER.md     # Production Render deployment blueprint
│   └── DEPLOYMENT_LEGACY_STEP19.md # Historical MySQL deployment guide
├── backend/                     # Node.js + Express + Prisma Backend
│   ├── prisma/
│   │   ├── migrations/          # Version-controlled PostgreSQL DDL migrations
│   │   └── schema.prisma        # Canonical PostgreSQL Prisma Schema (31 tables)
│   ├── scripts/                 # Operations, backup & OAuth helpers
│   │   ├── gdrive-auth.js       # Google Drive OAuth authorization generator
│   │   ├── backup-mysql.js      # Migration backup utility
│   │   └── cutover-to-postgres.js # PostgreSQL cutover verifier
│   ├── src/
│   │   ├── auth/                # Permissions, role guards, token validation
│   │   ├── config/              # Environment, database, rate limit config
│   │   ├── docs/                # OpenAPI specification & Swagger UI
│   │   ├── middleware/          # Helmet, CORS, error handling, audit logger
│   │   ├── modules/             # Auth, Notes, Collections, Dashboard, Academics
│   │   ├── services/storage/    # Google Drive & local disk storage providers
│   │   ├── app.js               # Express application composition
│   │   └── server.js            # Server entrypoint with graceful shutdown
│   └── tests/                   # 29 test suites (420 automated tests)
├── frontend/                    # React 18 + Vite PWA Application
│   ├── public/                  # Favicons, web manifest, robots, sitemap
│   ├── src/
│   │   ├── components/          # Reusable UI, Layout, Dashboard, Notes cards
│   │   ├── context/             # AuthContext, ThemeContext, NavigationContext
│   │   ├── pages/               # Explore, Dashboard, Notes, Admin Workspace
│   │   ├── services/            # Axios API clients
│   │   ├── styles/              # Design System CSS cascade (variables, tokens)
│   │   ├── App.jsx              # Client router with Protected/Guest routes
│   │   └── main.jsx             # React DOM root & PWA service worker hook
│   ├── eslint.config.js         # ESLint 9 Flat Config
│   └── vite.config.js           # Vite build & Workbox PWA configuration
├── render.yaml                  # Declarative Infrastructure-as-Code Blueprint
├── LICENSE                      # Academic Open License
├── package.json                 # Monorepo scripts & dependencies
└── README.md                    # This document
```

---

## 6. Local Development Setup

### Prerequisites
- **Node.js:** v20.x or higher
- **PostgreSQL:** v16.x running locally or via Docker
- **npm:** v10.x or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/pj-study.git
cd "PJ Study"

# Install monorepo dependencies
npm install

# Install backend & frontend packages
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment Variables
Copy the sample environment files:
```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your PostgreSQL database URL:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/pj_study?schema=public"
JWT_ACCESS_SECRET="your_long_32_character_super_secret_jwt_key_here"
FRONTEND_URL="http://localhost:5173"
STORAGE_PROVIDER="local"
```

Edit `frontend/.env`:
```env
VITE_API_BASE_URL="http://localhost:5001/api/v1"
```

### 3. Run Database Migrations
```bash
cd backend
npx prisma migrate deploy
```

### 4. Start Development Servers
From the root directory:
```bash
# Start backend API (Port 5001)
cd backend && npm run dev

# Start frontend Vite dev server (Port 5173) in a second terminal
cd frontend && npm run dev
```

Visit **http://localhost:5173** to explore PJ Study.

---

## 7. Verification & Testing

PJ Study includes a comprehensive automated test harness covering RBAC, security boundaries, authentication lifecycles, and E2E user journeys:

```bash
# Run all 420 backend tests across 29 test suites
cd backend && npm test

# Run frontend ESLint code quality audit
cd frontend && npm run lint

# Run frontend production build
cd frontend && npm run build
```

**Verification Results:**
- **Automated Tests:** 420 passed, 0 failed, 0 skipped (`npm test`).
- **Lint Quality:** 0 errors, 0 warnings (`npm run lint`).
- **Build Performance:** 713ms clean compile (`dist/` generated with 84 precache entries).

---

## 8. Production Deployment on Render

PJ Study is configured for seamless deployment on Render using the included Infrastructure-as-Code blueprint [`render.yaml`](file:///Users/piyush/Piyush/temp/PJ%20Study/render.yaml):

1. **Push your code** to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Select your repository. Render automatically provisions:
   - `pj-study-postgres` (Managed PostgreSQL 16 with automated daily backups)
   - `pj-study-backend` (Node.js Web Service running `node src/server.js` with `preDeployCommand: npx prisma migrate deploy`)
   - `pj-study-frontend` (Static Site with SPA route rewrites and global CDN edge)
4. Add your private Google Drive OAuth secrets in the Render dashboard.

For detailed production instructions, rollback procedures, and domain mapping, see the [Render Deployment Guide](file:///Users/piyush/Piyush/temp/PJ%20Study/docs/DEPLOYMENT_RENDER.md).

---

## 9. License

This project is licensed under the [Academic Open License](file:///Users/piyush/Piyush/temp/PJ%20Study/LICENSE). All rights reserved.
