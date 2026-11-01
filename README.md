# PJ Study

> **Tagline:** Your Entire Study World, One Place.

PJ Study is a modern academic notes and AI-powered study platform designed to allow students and educators to discover, upload, read, organize, and share curriculum notes. Future phases incorporate AI-powered summaries, flashcards, spaced-repetition quizzes, document-grounded AI chat, and comprehensive administration capabilities.

---

## 1. Architecture & Technology Stack

PJ Study is built as a modular monorepo adhering strictly to clean architecture and separation of concerns:

### Frontend (`frontend/`)

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** JavaScript ES6+ (no TypeScript)
- **Routing:** React Router v6
- **Styling:** Vanilla CSS3 with standard CSS variables for design tokens (no Tailwind, Bootstrap, or CSS-in-JS)
- **Design Direction:** Academic editorial aesthetics (Instrument Serif + Inter)
- **HTTP Client:** Axios with centralized services for Courses, Subjects, Topics, and Notes

### Backend (`backend/`)

- **Runtime:** Node.js (ES modules: `"type": "module"`)
- **Web Framework:** Express.js
- **Database:** MySQL (utf8mb4)
- **ORM:** Prisma ORM
- **API Architecture:** RESTful with `/api/v1` version prefix
- **Architectural Layers:** Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Prisma Client
- **Security & Logging:** Helmet, CORS, Morgan

---

## 2. Relational Database Architecture

The database architecture is normalized, strongly typed, and engineered for high data integrity using MySQL and Prisma ORM.

### A. Core Relational Models

| Model          | Table        | Purpose                                    | Deletion Behavior / Invariants                                                                                                                               |
| :------------- | :----------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`User`**     | `users`      | Student, moderator, and admin accounts     | Unique email. Password hashes only. Roles: `STUDENT`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.                                                                   |
| **`Course`**   | `courses`    | Academic degree / program (e.g. B.Tech CS) | Unique slug. `RESTRICT` deletion if referenced by subjects or notes.                                                                                         |
| **`Subject`**  | `subjects`   | Course unit / syllabus module              | Belongs to Course. Composite unique constraint `[courseId, slug]`. Semester bounded 1–12.                                                                    |
| **`Topic`**    | `topics`     | Granular concept in subject                | Belongs to Subject. Composite unique constraint `[subjectId, slug]`.                                                                                         |
| **`Note`**     | `notes`      | Uploaded study document manuscript         | Metadata only (storageKey, fileSize, mimeType, pageCount). No raw PDFs in MySQL. Status enum: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`. |
| **`Bookmark`** | `bookmarks`  | Saved notes in student library             | Composite unique constraint `[userId, noteId]`. Cascades on user or note deletion.                                                                           |
| **`Review`**   | `reviews`    | Peer ratings and written critiques         | Rating bounded 1 to 5. Composite unique `[userId, noteId]`. Authors prohibited from reviewing own notes.                                                     |
| **`Report`**   | `reports`    | Inappropriate content moderation flags     | Status: `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`. References reporter and reviewing moderator.                                                         |
| **`AuditLog`** | `audit_logs` | Administrative and moderation trail        | Retains action and JSON metadata. `SET NULL` on actor deletion to preserve audit history.                                                                    |

### B. Deletion & Relationship Invariants

1. **Academic Taxonomy Protection (`ON DELETE RESTRICT`):** Deleting a user or course will never accidentally orphan or cascade-delete curriculum subjects or approved study manuscripts.
2. **Personal Artifact Cleanup (`ON DELETE CASCADE`):** When a note is deleted, its user bookmarks, reviews, and pending reports are automatically cleaned up.
3. **Audit Immutability (`ON DELETE SET NULL`):** If a staff or moderator account is decommissioned, the audit log entries and moderation review stamps remain permanently for historical compliance.
4. **Public Exposure Invariant:** Public queries strictly filter notes by `status: 'APPROVED'`.

### C. Future AI Architecture

The roadmap for AI document parsing, vector chunking, interactive chat, quizzes, and spaced-repetition flashcards is detailed in [`backend/src/docs/AI_DATABASE_DESIGN.md`](file:///Users/piyush/Piyush/temp/PJ%20Study/backend/src/docs/AI_DATABASE_DESIGN.md).

---

## 3. Database Setup & Migration Workflow

### Step 1: Install & Start MySQL Server

Make sure MySQL 8.0+ is running locally or via Docker:

```bash
# Using Homebrew (macOS)
brew install mysql
brew services start mysql

# Or using Docker
docker run --name pj-study-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=pj_study -p 3306:3306 -d mysql:8.0
```

### Step 2: Create the Database

```sql
CREATE DATABASE pj_study CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Configure Environment Variables

In `backend/.env`:

```env
PORT=5001
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/pj_study"
FRONTEND_URL=http://localhost:5173
```

### Step 4: Run Prisma Migrations

```bash
# Apply migrations to database
npm --prefix backend run prisma:migrate

# Or directly with npx
cd backend
npx prisma migrate deploy
```

### Step 5: Regenerate Prisma Client

```bash
npm run prisma:generate
```

---

## 4. Directory Structure

```text
PJ Study/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                       # Core Prisma models and MySQL config
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       └── 20261101000000_init_core_schema/
│   │           └── migration.sql               # Production-ready MySQL DDL migration
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js                     # Singleton PrismaClient lifecycle
│   │   │   └── env.js                          # Environment variable validator
│   │   ├── docs/
│   │   │   ├── AI_DATABASE_DESIGN.md           # Future AI RAG & quiz data plan
│   │   │   └── README.md                       # Backend architecture guide
│   │   ├── middleware/
│   │   │   ├── errorHandler.js                 # Centralized JSON error formatter
│   │   │   └── notFound.js                     # 404 unmatched route handler
│   │   ├── modules/
│   │   │   ├── users/                          # User repository & service
│   │   │   ├── courses/                        # Course repository & service
│   │   │   ├── subjects/                       # Subject repository & service
│   │   │   ├── topics/                         # Topic repository & service
│   │   │   └── notes/                          # Note, Review & Bookmark service
│   │   ├── routes/
│   │   │   └── index.js                        # Versioned routes (/api/v1/health, /config)
│   │   ├── utils/
│   │   │   └── pagination.js                   # Standard pagination helper
│   │   ├── app.js                              # Express app configuration
│   │   └── server.js                           # Server listener & graceful shutdown
│   └── tests/
│       ├── health.test.js                      # API & 404 integration tests
│       └── schema_validation.test.js           # Domain invariants & schema tests
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                         # Button, Input, Badge, Avatar, Dropdown, Modal, Skeleton, EmptyState
│   │   │   └── layout/                         # Navbar, Footer, Container, PageHeader
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx                # Public navigation & footer shell
│   │   │   └── AppLayout.jsx                   # Student workspace sidebar shell
│   │   ├── pages/
│   │   │   ├── HomePage.jsx                    # Editorial academic landing page
│   │   │   ├── DesignSystemPage.jsx            # Interactive design system catalog
│   │   │   ├── DashboardShellPage.jsx          # Authenticated workspace shell
│   │   │   └── NotFoundPage.jsx                # Editorial 404 page
│   │   ├── services/
│   │   │   ├── api.js                          # Centralized Axios instance
│   │   │   ├── courseService.js                # Course API client
│   │   │   ├── subjectService.js               # Subject API client
│   │   │   ├── topicService.js                 # Topic API client
│   │   │   └── noteService.js                  # Notes, reviews, bookmarks client
│   │   └── styles/                             # variables, reset, typography, global, utilities, components
│   ├── package.json
│   └── vite.config.js
│
├── package.json                                # Monorepo scripts (dev, test, lint, format)
└── README.md
```

---

## 5. Build, Test, and Quality Commands

From the repository root:

| Command                   | Action                                                               |
| :------------------------ | :------------------------------------------------------------------- |
| `npm run dev`             | Runs backend and frontend development servers concurrently           |
| `npm test`                | Runs all backend automated unit, invariant, and API tests (12 tests) |
| `npm run check:backend`   | Validates backend configuration and environment variables            |
| `npm run lint`            | Runs ESLint on frontend JavaScript and JSX                           |
| `npm run format:check`    | Verifies Prettier code style across all files                        |
| `npm run format`          | Auto-formats code using Prettier                                     |
| `npm run build:frontend`  | Compiles production frontend bundle with Vite                        |
| `npm run prisma:generate` | Generates Prisma Client based on `schema.prisma`                     |
