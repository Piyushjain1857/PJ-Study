# PJ Study Backend Architecture Documentation

## Overview

PJ Study backend is built with Express.js (ES modules), Prisma ORM, and MySQL.

## API Versioning

All public REST API endpoints are prefixed with `/api/v1`.

### Endpoints Implemented in Step 1

- `GET /api/v1/health`
  - Returns server health, timestamp, and environment metadata without leaking sensitive data.

## Directory Layout

- `config/`: Environment validation and database client lifecycle management.
- `middleware/`: Error handling, not found 404 handler, request logging.
- `routes/`: Express routers organized by API version.
- `modules/`: Feature-oriented domains (auth, notes, ai, admin, etc.).
- `services/`: Business logic orchestration.
- `repositories/`: Data access layer interfacing with Prisma.
- `utils/`: Reusable helper utilities.
- `docs/`: Architecture and API documentation.
