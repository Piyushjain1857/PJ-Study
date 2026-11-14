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

## 5. Role-Based Access Control (RBAC) Architecture

PJ Study incorporates a centralized, multi-tier Role-Based Access Control (RBAC) framework engineered to uphold academic credibility, administrative accountability, and defense-in-depth authorization.

### A. Supported Roles

1. **`STUDENT`**: Default role for scholars and academic learners. Can explore notes, upload manuscripts, edit/delete their own notes, bookmark, and review peer notes.
2. **`MODERATOR`**: Academic review staff. Can review pending submissions, approve/reject notes, resolve content flags, and access moderation queues. Cannot manage staff, users, or system settings.
3. **`ADMIN`**: Platform administrators. Can manage students and moderators, suspend abusive accounts, curate academic taxonomies (courses, subjects, topics), and inspect system audit trails. Restricted from touching Admin or Super Admin accounts.
4. **`SUPER_ADMIN`**: Ultimate system stewards. Full governance capabilities, including role elevation/demotion, assigning Admin and Super Admin roles, viewing full audit trails, and system maintenance. Protected against accidental self-demotion or removal of the last remaining Super Admin.

### B. Role-Permission Matrix

| Permission Key      | Description                          | Student | Moderator | Admin | Super Admin |
| :------------------ | :----------------------------------- | :-----: | :-------: | :---: | :---------: |
| `notes:read`        | Read published academic notes        |    ✓    |     ✓     |   ✓   |      ✓      |
| `notes:create`      | Upload note manuscripts              |    ✓    |     ✓     |   ✓   |      ✓      |
| `notes:edit_own`    | Edit own uploaded notes              |    ✓    |     ✓     |   ✓   |      ✓      |
| `notes:delete_own`  | Delete own uploaded notes            |    ✓    |     ✓     |   ✓   |      ✓      |
| `notes:review`      | Review/approve/reject submissions    |    —    |     ✓     |   ✓   |      ✓      |
| `notes:delete_any`  | Permanently remove any note          |    —    |     —     |   ✓   |      ✓      |
| `categories:manage` | Manage courses, subjects, topics     |    —    |     —     |   ✓   |      ✓      |
| `users:read`        | Search and inspect user directory    |    —    |     —     |   ✓   |      ✓      |
| `users:suspend`     | Suspend or reactivate user accounts  |    —    |     —     |   ✓   |      ✓      |
| `moderators:manage` | Assign or revoke Moderator role      |    —    |     —     |   ✓   |      ✓      |
| `admins:manage`     | Assign or revoke Admin / Super Admin |    —    |     —     |   —   |      ✓      |
| `settings:manage`   | Configure global system parameters   |    —    |     —     |   —   |      ✓      |
| `audit_logs:read`   | Inspect administrative audit trails  |    —    |     —     |   ✓   |      ✓      |

### C. Backend Authorization Middleware & Guard Functions

All authorization is anchored centrally in `backend/src/auth/`:

- **`requireAuth`**: Validates the Bearer JWT access token and queries MySQL to guarantee the user exists, is active (not suspended), and retrieves their real-time role.
- **`requireRole(...roles)`**: Restricts an endpoint to users whose role matches one of the specified roles.
- **`requirePermission(permission)`**: Evaluates granular permissions via the role-permission matrix.
- **`assertNoteOwnership(noteId, userId, userRole)` / `requireNoteOwnership`**: Enforces that only the manuscript author (or an authorized administrator) can update or delete notes, completely preventing IDOR attacks.

```javascript
// Example: Route protection
router.patch(
  '/notes/:id',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_EDIT_OWN),
  requireNoteOwnership('id'),
  noteController.updateNote
);

router.patch(
  '/admin/users/:id/role',
  requireAuth,
  requirePermission(PERMISSIONS.MODERATORS_MANAGE),
  adminController.changeUserRole
);
```

### D. Administrative Governance Invariants & Session Revocation

1. **Hierarchy Integrity:** An actor cannot modify or demote a user whose role is equal to or higher than their own. Admins can only assign or revoke `STUDENT` or `MODERATOR`. Only `SUPER_ADMIN` can assign `ADMIN` or `SUPER_ADMIN`.
2. **Self-Role Protection:** Users cannot alter their own role, protecting against privilege escalation or accidental lockout.
3. **Last Super Admin Invariant:** Demoting or deactivating the last active `SUPER_ADMIN` is strictly rejected by the database service layer with code `LAST_SUPER_ADMIN_PROTECTED`.
4. **Instant Multi-Device Session Revocation:** When an account is suspended or its role is changed, all existing refresh sessions for that user are immediately invalidated (`revokedAt = NOW()`), forcing the user to re-authenticate or be locked out immediately.
5. **Auditing:** Every role change or suspension writes an immutable record to the `audit_logs` table with `actorId`, `action`, `entityType`, `entityId`, and `metadata` (including reason and previous/new states).

### E. Frontend RBAC Components & Integration

- **`useAuth()`**: Exposes `hasPermission(permission)`, `hasRole(...roles)`, `isAdmin`, `isSuperAdmin`, `isModerator`, and `permissions` list.
- **`<RequirePermission permission={...}>`**: Declaratively wraps UI elements (buttons, forms, links) and only renders children when the authenticated user possesses the permission.
- **`<RequireRole roles={[...]}>`**: Conditionally displays components based on role membership.
- **`ProtectedRoute`**: Supports `requiredRoles` and `requiredPermissions` props. Redirects unauthorized authenticated users to `/unauthorized` (HTTP 403 Forbidden page).
- **Admin Dashboard (`/admin`)**: A comprehensive management interface accessible exclusively to `ADMIN` and `SUPER_ADMIN`, featuring:
  - User Directory with real-time search, role filter, status filter, and pagination.
  - Staff & Moderators management tab.
  - Role Assignment modal with hierarchy verification and audit reason prompt.
  - Account Suspension / Reactivation modal.
  - Immutable Audit Log Trail with JSON metadata modal.
  - Visual Role & Permissions Matrix reference grid.

---

## 6. Notes Management System

PJ Study implements a full-lifecycle, peer-moderated academic notes management system engineered to balance student contribution freedom with rigorous academic review.

### A. Note Status Lifecycle

```text
               ┌──────────┐
               │  DRAFT   │◄──────────────┐
               └────┬─────┘               │
                    │ (Submit)            │ (Revise)
                    ▼                     │
           ┌─────────────────┐            │
           │ PENDING_REVIEW  ├────────────┘
           └───────┬─┬───────┘ (Rejection with Feedback)
   (Approve)       │ │
  ┌────────────────┘ └──────────────┐
  ▼                                 ▼
┌──────────┐                  ┌──────────┐
│ APPROVED │                  │ REJECTED │
└────┬─────┘                  └──────────┘
     │ (Archive)
     ▼
┌──────────┐
│ ARCHIVED │
└──────────┘
```

1. **`DRAFT`:** Private working copy. Only visible and editable by the author. Can be deleted by author.
2. **`PENDING_REVIEW` (`PENDING`):** Locked for editing by author. Visible in moderation queue for staff.
3. **`APPROVED`:** Publicly visible in the Notes Library with publication timestamp. Downloadable by scholars.
4. **`REJECTED`:** Retains constructive reviewer feedback so student knows exactly what to fix before editing and resubmitting.
5. **`ARCHIVED`:** Read-only historical copy stored in author's personal archive.

### B. Secure Storage & Anti-Spoofing File Validation

All study materials undergo multi-layer inspection before reaching storage:

- **Supported Formats:** PDF (`.pdf`), Word (`.doc`, `.docx`), PowerPoint (`.ppt`, `.pptx`), Plain Text (`.txt`), Markdown (`.md`), Images (`.png`, `.jpg`, `.jpeg`).
- **Signature & Magic Byte Verification:** Reject files whose binary header mismatches their extension (e.g., rejecting an executable renamed to `.pdf`).
- **Forbidden Blacklist:** Explicit rejection of all executable scripts and binaries (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.php`, `.py`, `.html`).
- **Configurable Limits:** `MAX_FILE_SIZE_MB` (default `25MB`), `UPLOAD_DIR` (`uploads/notes`), and `STORAGE_PROVIDER` (`local`).
- **Storage Abstraction:** Storage keys are cryptographically generated UUID/hashes (`crypto.randomBytes(16)`), and path resolution enforces strict containment within the upload directory to completely neutralize path traversal attacks.

### C. Notes API Reference

| Method   | Endpoint                         | Auth       | Purpose                                                                      |
| :------- | :------------------------------- | :--------- | :--------------------------------------------------------------------------- |
| `GET`    | `/api/v1/notes`                  | Public     | List approved public notes with search, filters, pagination                  |
| `GET`    | `/api/v1/notes/me`               | Bearer JWT | Current user's notes with status filtering (`DRAFT`, `PENDING_REVIEW`, etc.) |
| `GET`    | `/api/v1/users/me/notes`         | Bearer JWT | Alias for current user's notes dashboard                                     |
| `GET`    | `/api/v1/notes/moderation/queue` | Staff      | Pending submissions queue for academic review                                |
| `GET`    | `/api/v1/notes/:id`              | Optional   | View note; private drafts restricted to author and staff                     |
| `GET`    | `/api/v1/notes/:id/file`         | Optional   | Stream file download (draft files restricted to author/staff)                |
| `POST`   | `/api/v1/notes`                  | Bearer JWT | Create note (with optional multipart document attachment)                    |
| `PATCH`  | `/api/v1/notes/:id`              | Bearer JWT | Update draft/rejected note with optional replacement file                    |
| `DELETE` | `/api/v1/notes/:id`              | Bearer JWT | Delete note (author of draft/rejected or administrator)                      |
| `POST`   | `/api/v1/notes/:id/submit`       | Bearer JWT | Submit draft or rejected note for moderation review                          |
| `POST`   | `/api/v1/notes/:id/archive`      | Bearer JWT | Archive approved note                                                        |
| `POST`   | `/api/v1/notes/:id/review`       | Staff      | Approve note or reject with feedback reason (writes audit log)               |
| `GET`    | `/api/v1/categories`             | Public     | List active academic note categories                                         |

---

## 7. Relational Database Architecture

The database architecture is normalized, strongly typed, and engineered for high data integrity using MySQL and Prisma ORM.

### A. Core Relational Models

| Model                        | Table                       | Purpose                                    | Deletion Behavior / Invariants                                                                                                                                                                                                                               |
| :--------------------------- | :-------------------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`User`**                   | `users`                     | Student, moderator, and admin accounts     | Unique email. Password hashes only. Roles: `STUDENT`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.                                                                                                                                                                   |
| **`RefreshSession`**         | `refresh_sessions`          | Active sessions & rotation hashes          | Cascades on user deletion. Token hash indexed & unique. Revoked sessions retained for reuse detection.                                                                                                                                                       |
| **`EmailVerificationToken`** | `email_verification_tokens` | Single-use email confirmation links        | Cascades on user deletion. Token hash indexed & unique. `usedAt` prevents replay.                                                                                                                                                                            |
| **`PasswordResetToken`**     | `password_reset_tokens`     | Single-use password reset tokens           | Cascades on user deletion. Token hash indexed & unique. Invalidates all active user sessions upon use.                                                                                                                                                       |
| **`Course`**                 | `courses`                   | Academic degree / program (e.g. B.Tech CS) | Unique slug. `RESTRICT` deletion if referenced by subjects or notes.                                                                                                                                                                                         |
| **`Subject`**                | `subjects`                  | Course unit / syllabus module              | Belongs to Course. Composite unique constraint `[courseId, slug]`. Semester bounded 1–12.                                                                                                                                                                    |
| **`Topic`**                  | `topics`                    | Granular concept in subject                | Belongs to Subject. Composite unique constraint `[subjectId, slug]`.                                                                                                                                                                                         |
| **`Category`**               | `categories`                | Academic note format / genre               | Unique slug & name (e.g., Lecture Notes, Exam Solutions, Lab Manuals).                                                                                                                                                                                       |
| **`Note`**                   | `notes`                     | Study material manuscript & document       | Supports written text content or uploaded files. Fields: `title`, `slug`, `content`, `fileName`, `storageKey`, `fileSize`, `mimeType`, `semester`, `academicYear`, `rejectionReason`. Status: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`. |
| **`Bookmark`**               | `bookmarks`                 | Saved notes in student library             | Composite unique constraint `[userId, noteId]`. Cascades on user or note deletion.                                                                                                                                                                           |
| **`Review`**                 | `reviews`                   | Peer ratings and written critiques         | Rating bounded 1 to 5. Composite unique `[userId, noteId]`. Authors prohibited from reviewing own notes.                                                                                                                                                     |
| **`Report`**                 | `reports`                   | Inappropriate content moderation flags     | Status: `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`. References reporter and reviewing moderator.                                                                                                                                                         |
| **`AuditLog`**               | `audit_logs`                | Administrative and moderation trail        | Retains action and JSON metadata. `SET NULL` on actor deletion to preserve audit history.                                                                                                                                                                    |

---

## 8. Directory Structure

```text
PJ Study/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                       # Core Prisma models, Auth tables, Categories, Notes & MySQL config
│   │   ├── seed.js                             # Database seeder (Super Admin, Moderator, Student, Categories, Subjects)
│   │   └── migrations/
│   │       ├── 20261101000000_init_core_schema/
│   │       │   └── migration.sql               # Base 9 core tables DDL
│   │       ├── 20261101100000_add_auth_sessions_and_tokens/
│   │       │   └── migration.sql               # Auth tables DDL (refresh_sessions, tokens)
│   │       └── 20261112043146_add_note_management_fields_and_categories/
│   │           └── migration.sql               # Notes lifecycle fields, Categories model DDL
│   ├── src/
│   │   ├── auth/                               # Centralized RBAC Core
│   │   │   ├── permissions.js                  # Granular capability definitions
│   │   │   ├── rolePermissions.js              # Role hierarchy & permissions matrix
│   │   │   ├── requireAuth.js                  # Bearer JWT & active user validator (with optionalAuth)
│   │   │   ├── requireRole.js                  # Role guard middleware
│   │   │   ├── requirePermission.js            # Capability guard middleware
│   │   │   ├── ownership.js                    # Resource ownership assertion (IDOR defense)
│   │   │   └── index.js                        # Unified auth exports
│   │   ├── config/
│   │   │   ├── database.js                     # Singleton PrismaClient lifecycle
│   │   │   └── env.js                          # Environment variable validator (JWT, email, DB, uploads)
│   │   ├── middleware/
│   │   │   ├── errorHandler.js                 # Centralized JSON error formatter
│   │   │   └── notFound.js                     # 404 unmatched route handler
│   │   ├── modules/
│   │   │   ├── admin/                          # User governance, role assignment & audit queries
│   │   │   ├── audit/                          # Audit log repository & immutable service
│   │   │   ├── auth/                           # Controller, Service, Repository, Middleware, Validation
│   │   │   ├── categories/                     # Category repository, service, controller, routes
│   │   │   ├── users/                          # User repository & service
│   │   │   ├── courses/                        # Course repository & service
│   │   │   ├── subjects/                       # Subject repository & service
│   │   │   ├── topics/                         # Topic repository & service
│   │   │   └── notes/                          # Note service, repository, controller, routes, upload middleware
│   │   ├── services/
│   │   │   ├── storage/                        # Storage abstraction with signature validation
│   │   │   ├── tokens/                         # Cryptographic token generator & JWT signer
│   │   │   └── email/                          # Provider abstraction & branded HTML templates
│   │   ├── routes/
│   │   │   └── index.js                        # Mounted routes (/health, /config, /auth, /admin, /notes, /categories)
│   │   ├── utils/
│   │   │   ├── apiResponse.js                  # Standard sendSuccess / sendError helpers
│   │   │   ├── password.js                     # Bcrypt hashing & strength evaluation
│   │   │   └── pagination.js                   # Standard pagination envelope helper
│   │   ├── app.js                              # Express app configuration & cookie parser
│   │   └── server.js                           # Server listener & graceful shutdown
│   └── tests/
│       ├── auth.test.js                        # Auth unit, invariant, security & API tests (22 tests)
│       ├── discovery.test.js                   # Advanced notes discovery, search, academic filters & download tests (14 tests)
│       ├── health.test.js                      # API & 404 integration tests (5 tests)
│       ├── notes.test.js                       # Notes lifecycle, file validation, ownership & moderation tests (27 tests)
│       ├── rbac.test.js                        # RBAC permissions, hierarchy, session revocation & audit tests (24 tests)
│       └── schema_validation.test.js           # Domain invariants & schema tests (7 tests)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                           # RequirePermission, RequireRole conditional wrappers
│   │   │   ├── common/                         # Button, Input, Badge, Avatar, Dropdown, Modal, ProtectedRoute, GuestRoute
│   │   │   ├── layout/                         # Navbar (dynamic role navigation), Footer, Container, PageHeader
│   │   │   └── notes/                          # NoteCard, NoteListCard, NotesSearchBar, NotesFilterPanel, NotesSortControl, NotesViewToggle, NotesResultsGrid, NotesResultsList, NotesPagination, NotePreview, FileUpload, NoteForm
│   │   ├── context/
│   │   │   └── AuthContext.jsx                 # Global auth state, RBAC capability helpers & silent refresh
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx                # Public navigation & footer shell
│   │   │   └── AppLayout.jsx                   # Student workspace sidebar shell
│   │   ├── pages/
│   │   │   ├── admin/                          # AdminDashboardPage (Users, Staff, Audit Logs, Matrix)
│   │   │   ├── auth/                           # LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage
│   │   │   ├── notes/                          # NotesExplorePage, NoteDetailsPage, CreateNotePage, EditNotePage, MyNotesPage
│   │   │   ├── HomePage.jsx                    # Editorial academic landing page
│   │   │   ├── DesignSystemPage.jsx            # Interactive design system catalog
│   │   │   ├── DashboardShellPage.jsx          # Authenticated workspace shell
│   │   │   ├── UnauthorizedPage.jsx            # 403 Forbidden page
│   │   │   └── NotFoundPage.jsx                # Editorial 404 page
│   │   ├── services/
│   │   │   ├── adminService.js                 # Administrative API client
│   │   │   ├── api.js                          # Axios instance with 401 refresh queue
│   │   │   ├── authService.js                  # Frontend auth API methods
│   │   │   ├── categoryService.js              # Academic category API client
│   │   │   ├── courseService.js                # Course API client
│   │   │   ├── subjectService.js               # Subject API client
│   │   │   ├── topicService.js                 # Topic API client
│   │   │   └── noteService.js                  # Notes, discovery, reviews, bookmarks, downloads, moderation client
│   │   ├── utils/
│   │   │   └── permissions.js                  # Client-side permission constants & role hierarchies
│   │   └── styles/                             # variables, reset, typography, global, utilities, components, notes-discovery.css, notes.css
│   ├── package.json
│   └── vite.config.js
│
├── package.json                                # Monorepo scripts (dev, test, lint, format)
└── README.md
```

---

## 9. Build, Test, and Quality Commands

From the repository root:

| Command                   | Action                                                                   |
| :------------------------ | :----------------------------------------------------------------------- |
| `npm run dev`             | Runs backend and frontend development servers concurrently               |
| `npm test`                | Runs all backend automated unit, invariant, and API tests (**99 tests**) |
| `npm run check:backend`   | Validates backend configuration and environment variables                |
| `npm run lint`            | Runs ESLint on frontend JavaScript and JSX                               |
| `npm run format:check`    | Verifies Prettier code style across all files                            |
| `npm run format`          | Auto-formats code using Prettier                                         |
| `npm run build:frontend`  | Compiles production frontend bundle with Vite                            |
| `npm run prisma:generate` | Generates Prisma Client based on `schema.prisma`                         |
