# PJ Study

> **Tagline:** Your Entire Study World, One Place.

PJ Study is a modern academic notes and AI-powered study platform designed to allow students and educators to discover, upload, read, organize, and share curriculum notes. Future phases will incorporate AI-powered summaries, flashcards, spaced-repetition quizzes, document-grounded AI chat, and comprehensive administration capabilities.

---

## 1. Architecture & Technology Stack

PJ Study is built as a modular monorepo adhering strictly to clean architecture and separation of concerns:

### Frontend (`frontend/`)

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** JavaScript ES6+ (no TypeScript)
- **Routing:** React Router v6
- **Styling:** Vanilla CSS3 with standard CSS variables for design tokens (no Tailwind, Bootstrap, or CSS-in-JS)
- **HTTP Client:** Axios with centralized interceptors

### Backend (`backend/`)

- **Runtime:** Node.js (ES modules: `"type": "module"`)
- **Web Framework:** Express.js
- **Database:** MySQL
- **ORM:** Prisma ORM
- **API Architecture:** RESTful with `/api/v1` version prefix
- **Security & Logging:** Helmet, CORS, Morgan

---

## 2. Directory Structure

```text
pj-study/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Prisma data models and MySQL config
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # Prisma connection lifecycle
│   │   │   └── env.js           # Environment variable validation
│   │   ├── docs/
│   │   │   └── README.md        # Backend architecture notes
│   │   ├── middleware/
│   │   │   ├── errorHandler.js  # Centralized error formatter
│   │   │   └── notFound.js      # 404 unmatched route handler
│   │   ├── modules/             # Domain modules (auth, notes, ai, etc.)
│   │   ├── repositories/        # Data access abstraction
│   │   ├── routes/
│   │   │   └── index.js         # Versioned API routes (/api/v1)
│   │   ├── services/            # Business logic orchestration
│   │   ├── utils/               # Shared utilities & response formatters
│   │   ├── app.js               # Express app configuration & middlewares
│   │   └── server.js            # Server listening & graceful shutdown
│   ├── tests/
│   │   └── health.test.js       # Node native tests for API health & 404s
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── vite.svg             # Application branding icon
│   ├── src/
│   │   ├── app/
│   │   │   └── router.jsx       # React Router route configuration
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   └── StatusBadge.css
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       ├── Header.css
│   │   │       ├── Footer.jsx
│   │   │       └── Footer.css
│   │   ├── context/             # Global React Context providers
│   │   ├── features/            # Feature-specific components and logic
│   │   ├── hooks/               # Custom reusable React hooks
│   │   ├── layouts/
│   │   │   ├── RootLayout.jsx   # Layout shell with Header/Outlet/Footer
│   │   │   └── RootLayout.css
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Branding & backend health indicator
│   │   │   ├── HomePage.css
│   │   │   ├── NotFoundPage.jsx # 404 user-friendly error page
│   │   │   └── NotFoundPage.css
│   │   ├── services/
│   │   │   └── api.js           # Centralized Axios instance & API calls
│   │   ├── styles/
│   │   │   ├── variables.css    # CSS custom property design tokens
│   │   │   ├── global.css       # Base reset, typography, and element defaults
│   │   │   └── utilities.css    # Layout containers, flexbox & card helpers
│   │   ├── utils/               # Formatters and client-side utilities
│   │   ├── App.jsx              # Router provider root
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── .gitignore
├── .prettierrc
├── package.json                 # Monorepo scripts (dev, test, lint, format)
└── README.md
```

---

## 3. Environment Configuration

### Frontend (`frontend/.env.example`)

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Backend (`backend/.env.example`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/pj_study"
FRONTEND_URL=http://localhost:5173
```

> **macOS Port 5000 Notice:** On macOS Monterey and later, Apple's **AirPlay Receiver** listens on port 5000 by default. If port 5000 is occupied:
>
> 1. Set `PORT=5001` in `backend/.env` and `VITE_API_BASE_URL=http://localhost:5001/api/v1` in `frontend/.env`, OR
> 2. Disable AirPlay Receiver: _System Settings > General > AirDrop & AirPlay > AirPlay Receiver (toggle off)_.

---

## 4. Getting Started & Development

### 1. Install All Dependencies

From the repository root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Run Development Servers

To run both backend and frontend concurrently:

```bash
npm run dev
```

To run services independently:

```bash
# Start backend Express server (default: http://localhost:5000 or 5001)
npm run dev:backend

# Start frontend Vite server (default: http://localhost:5173)
npm run dev:frontend
```

---

## 5. Build, Test, and Quality Checks

```bash
# Build frontend for production
npm run build:frontend

# Run backend automated tests (built-in Node test runner)
npm test

# Check backend environment configuration without starting server
npm run check:backend

# Run frontend ESLint code quality checks
npm run lint

# Check formatting across all files with Prettier
npm run format:check

# Auto-format all codebase files with Prettier
npm run format
```

---

## 6. Health Endpoint Specification

- **Endpoint:** `GET /api/v1/health`
- **Description:** Verifies server runtime status, API version, and uptime without leaking secrets.
- **Example Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "product": "PJ Study",
    "tagline": "Your Entire Study World, One Place.",
    "version": "1.0.0",
    "timestamp": "2026-11-01T11:12:49.931Z",
    "uptimeSeconds": 42,
    "environment": "development"
  }
}
```
