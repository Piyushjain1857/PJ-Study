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
- **Routing:** React Router v6 with `ProtectedRoute` and `GuestRoute` guards
- **Styling:** Vanilla CSS3 with standard CSS variables for design tokens (no Tailwind, Bootstrap, or CSS-in-JS)
- **Design Direction:** Academic editorial aesthetics (Instrument Serif + Inter)
- **State Management:** React Context (`AuthContext`) with in-memory access token storage
- **HTTP Client:** Axios with silent refresh interceptors and credentials support

### Backend (`backend/`)

- **Runtime:** Node.js (ES modules: `"type": "module"`)
- **Web Framework:** Express.js
- **Database:** MySQL (utf8mb4)
- **ORM:** Prisma ORM
- **API Architecture:** RESTful with `/api/v1` version prefix
- **Architectural Layers:** Route $\rightarrow$ Middleware $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database
- **Security:** Helmet, CORS (with credentials), CookieParser, Express Rate Limit, Bcrypt (salt rounds 12), SHA-256 token hashing, JWT (short-lived 15m)

---

## 2. Authentication & Account Management Architecture

PJ Study implements a production-grade, secure authentication system engineered for high academic trust and defensibility:

### A. Security & Token Strategy

| Token Type                   | Lifetime             | Storage Location                                  | Purpose & Security Guarantees                                                                                                                |
| :--------------------------- | :------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access Token**             | Short-lived (`15m`)  | In-memory (`api.js` state variable)               | Signed JWT containing `{ sub: userId, email, role }`. In-memory storage completely mitigates malicious token extraction through XSS attacks. |
| **Refresh Token**            | Configurable (`7d`)  | `HttpOnly`, `SameSite: 'lax'`, `Secure` (in prod) | 64-character cryptographically random hex token. Only its SHA-256 hash is stored in MySQL. Exclusively scoped to `/api/v1/auth`.             |
| **Email Verification Token** | Configurable (`24h`) | Database table (`email_verification_tokens`)      | Single-use random token hashed via SHA-256. Invalidated immediately upon verification.                                                       |
| **Password Reset Token**     | Short-lived (`15m`)  | Database table (`password_reset_tokens`)          | Single-use random token hashed via SHA-256. Invalidated upon reset. Triggers instant revocation of all active multi-device refresh sessions. |

### B. Session Lifecycle & Refresh Token Rotation

1. **Automatic Rotation:** Every invocation of `POST /api/v1/auth/refresh` revokes the incoming refresh session and issues a new refresh token and fresh access token in an atomic transaction.
2. **Reuse Detection (Anti-Session Hijacking):** If an already revoked or reused refresh token is presented to the backend, the server immediately flags session compromise and terminates all active sessions for that user across all devices.
3. **No Persistent Token Leakage:** Neither `passwordHash` nor plaintext verification/reset/refresh tokens are ever returned in API responses or logs.

### C. Rate Limiting

- **Strict Limiter:** 10 requests per 15-minute window for sensitive endpoints (`/register`, `/login`, `/forgot-password`, `/reset-password`).
- **General Limiter:** 60 requests per 15-minute window for session checks (`/refresh`, `/verify-email`).
- Responses return HTTP `429 Too Many Requests` with structured JSON errors.

---

## 3. Authentication API Endpoints (`/api/v1/auth`)

| Method | Endpoint                             | Auth Required | Description                                                     |
| :----- | :----------------------------------- | :------------ | :-------------------------------------------------------------- |
| `POST` | `/api/v1/auth/register`              | Public        | Creates scholar account, hashes password, sends verification    |
| `POST` | `/api/v1/auth/login`                 | Public        | Validates credentials, sets HttpOnly cookie, returns access JWT |
| `POST` | `/api/v1/auth/refresh`               | Cookie        | Rotates refresh session, returns new access JWT                 |
| `POST` | `/api/v1/auth/logout`                | Public/Cookie | Revokes refresh session and clears cookie                       |
| `GET`  | `/api/v1/auth/verify-email?token=..` | Public        | Validates single-use token and marks account verified           |
| `POST` | `/api/v1/auth/verify-email`          | Public        | Body-based alternative for email verification                   |
| `POST` | `/api/v1/auth/resend-verification`   | Public        | Dispatches fresh verification link (generic response)           |
| `POST` | `/api/v1/auth/forgot-password`       | Public        | Sends password reset instructions (generic response)            |
| `POST` | `/api/v1/auth/reset-password`        | Public        | Validates reset token and sets new password                     |
| `GET`  | `/api/v1/auth/me`                    | Bearer JWT    | Returns authenticated user profile and verification status      |
| `POST` | `/api/v1/auth/change-password`       | Bearer JWT    | Verifies current password and updates to new password           |

---

## 4. Frontend Authentication & Pages

The frontend provides a cohesive editorial user experience for scholars:

- **Auth Context (`useAuth()`):** Manages `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`, `refreshUser()`.
- **Axios Silent Refresh:** Automatically intercepts 401 responses, calls `/auth/refresh` with cookies, and replays failed requests transparently.
- **Route Guards:**
  - `ProtectedRoute`: Guards `/profile` and future study workspaces; redirects unauthenticated visitors to `/login`.
  - `GuestRoute`: Prevents logged-in scholars from viewing `/login`, `/register`, `/forgot-password`, or `/reset-password`.
- **Pages:**
  - `LoginPage` (`/login`): Clean login card with show/hide password toggle.
  - `RegisterPage` (`/register`): Registration with real-time academic password strength meter.
  - `VerifyEmailPage` (`/verify-email`): Token validation banner with resend fallback.
  - `ForgotPasswordPage` (`/forgot-password`): Secure email recovery request.
  - `ResetPasswordPage` (`/reset-password`): Password reset with strength verification.
  - `ProfilePage` (`/profile`): Scholar profile, verification badge, and password change form.

---

## 5. Relational Database Architecture

The database architecture is normalized, strongly typed, and engineered for high data integrity using MySQL and Prisma ORM.

### A. Core Relational Models

| Model                        | Table                       | Purpose                                    | Deletion Behavior / Invariants                                                                                                                               |
| :--------------------------- | :-------------------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`User`**                   | `users`                     | Student, moderator, and admin accounts     | Unique email. Password hashes only. Roles: `STUDENT`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.                                                                   |
| **`RefreshSession`**         | `refresh_sessions`          | Active sessions & rotation hashes          | Cascades on user deletion. Token hash indexed & unique. Revoked sessions retained for reuse detection.                                                       |
| **`EmailVerificationToken`** | `email_verification_tokens` | Single-use email confirmation links        | Cascades on user deletion. Token hash indexed & unique. `usedAt` prevents replay.                                                                            |
| **`PasswordResetToken`**     | `password_reset_tokens`     | Single-use password reset tokens           | Cascades on user deletion. Token hash indexed & unique. Invalidates all active user sessions upon use.                                                       |
| **`Course`**                 | `courses`                   | Academic degree / program (e.g. B.Tech CS) | Unique slug. `RESTRICT` deletion if referenced by subjects or notes.                                                                                         |
| **`Subject`**                | `subjects`                  | Course unit / syllabus module              | Belongs to Course. Composite unique constraint `[courseId, slug]`. Semester bounded 1–12.                                                                    |
| **`Topic`**                  | `topics`                    | Granular concept in subject                | Belongs to Subject. Composite unique constraint `[subjectId, slug]`.                                                                                         |
| **`Note`**                   | `notes`                     | Uploaded study document manuscript         | Metadata only (storageKey, fileSize, mimeType, pageCount). No raw PDFs in MySQL. Status enum: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`. |
| **`Bookmark`**               | `bookmarks`                 | Saved notes in student library             | Composite unique constraint `[userId, noteId]`. Cascades on user or note deletion.                                                                           |
| **`Review`**                 | `reviews`                   | Peer ratings and written critiques         | Rating bounded 1 to 5. Composite unique `[userId, noteId]`. Authors prohibited from reviewing own notes.                                                     |
| **`Report`**                 | `reports`                   | Inappropriate content moderation flags     | Status: `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`. References reporter and reviewing moderator.                                                         |
| **`AuditLog`**               | `audit_logs`                | Administrative and moderation trail        | Retains action and JSON metadata. `SET NULL` on actor deletion to preserve audit history.                                                                    |

---

## 6. Directory Structure

```text
PJ Study/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                       # Core Prisma models, Auth tables, and MySQL config
│   │   └── migrations/
│   │       ├── 20261101000000_init_core_schema/
│   │       │   └── migration.sql               # Base 9 core tables DDL
│   │       └── 20261101100000_add_auth_sessions_and_tokens/
│   │           └── migration.sql               # Auth tables DDL (refresh_sessions, tokens)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js                     # Singleton PrismaClient lifecycle
│   │   │   └── env.js                          # Environment variable validator (JWT, email, DB)
│   │   ├── middleware/
│   │   │   ├── errorHandler.js                 # Centralized JSON error formatter
│   │   │   └── notFound.js                     # 404 unmatched route handler
│   │   ├── modules/
│   │   │   ├── auth/                           # Controller, Service, Repository, Middleware, Validation
│   │   │   ├── users/                          # User repository & service
│   │   │   ├── courses/                        # Course repository & service
│   │   │   ├── subjects/                       # Subject repository & service
│   │   │   ├── topics/                         # Topic repository & service
│   │   │   └── notes/                          # Note, Review & Bookmark service
│   │   ├── services/
│   │   │   ├── tokens/                         # Cryptographic token generator & JWT signer
│   │   │   └── email/                          # Provider abstraction & branded HTML templates
│   │   ├── routes/
│   │   │   └── index.js                        # Versioned routes (/health, /config, /auth)
│   │   ├── utils/
│   │   │   ├── apiResponse.js                  # Standard sendSuccess / sendError helpers
│   │   │   ├── password.js                     # Bcrypt hashing & strength evaluation
│   │   │   └── pagination.js                   # Standard pagination helper
│   │   ├── app.js                              # Express app configuration & cookie parser
│   │   └── server.js                           # Server listener & graceful shutdown
│   └── tests/
│       ├── auth.test.js                        # Unit, invariant, security & API tests (22 tests)
│       ├── health.test.js                      # API & 404 integration tests (5 tests)
│       └── schema_validation.test.js           # Domain invariants & schema tests (7 tests)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                         # Button, Input, Badge, Avatar, Dropdown, Modal, ProtectedRoute, GuestRoute
│   │   │   └── layout/                         # Navbar (with auth state), Footer, Container, PageHeader
│   │   ├── context/
│   │   │   └── AuthContext.jsx                 # Global auth state & silent refresh lifecycle
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx                # Public navigation & footer shell
│   │   │   └── AppLayout.jsx                   # Student workspace sidebar shell
│   │   ├── pages/
│   │   │   ├── auth/                           # LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage
│   │   │   ├── HomePage.jsx                    # Editorial academic landing page
│   │   │   ├── DesignSystemPage.jsx            # Interactive design system catalog
│   │   │   ├── DashboardShellPage.jsx          # Authenticated workspace shell
│   │   │   └── NotFoundPage.jsx                # Editorial 404 page
│   │   ├── services/
│   │   │   ├── api.js                          # Axios instance with 401 refresh queue
│   │   │   ├── authService.js                  # Frontend auth API methods
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

## 7. Build, Test, and Quality Commands

From the repository root:

| Command                   | Action                                                               |
| :------------------------ | :------------------------------------------------------------------- |
| `npm run dev`             | Runs backend and frontend development servers concurrently           |
| `npm test`                | Runs all backend automated unit, invariant, and API tests (34 tests) |
| `npm run check:backend`   | Validates backend configuration and environment variables            |
| `npm run lint`            | Runs ESLint on frontend JavaScript and JSX                           |
| `npm run format:check`    | Verifies Prettier code style across all files                        |
| `npm run format`          | Auto-formats code using Prettier                                     |
| `npm run build:frontend`  | Compiles production frontend bundle with Vite                        |
| `npm run prisma:generate` | Generates Prisma Client based on `schema.prisma`                     |
