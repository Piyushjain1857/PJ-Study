# PJ STUDY — PRODUCTION DEPLOYMENT & READINESS BLUEPRINT (STEP 19)

**Product:** PJ Study  
**Tagline:** Your Entire Study World, One Place.  
**Version:** 1.0.0 (Step 19 Production-Ready)  

---

## 1. System Architecture Overview

```
[ Client Browser / Mobile ]
           │
           ▼
[ Reverse Proxy / Cloudflare / Nginx (SSL/TLS 443 Offloading) ]
     │                                            │
     ▼                                            ▼
[ Static Assets (Frontend) ]              [ Node.js API (Backend) ]
  React + Vite SPA                          Express.js (Port 5001)
  Vite Output in /dist                      Reverse Proxy Trust Enabled
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        ▼                                                   ▼
              [ MySQL 8.0+ Database ]                           [ Persistent Storage ]
              Prisma ORM (Port 3306)                             /var/data/pjstudy/uploads
              Composite Indexes & Strict FK                      Encrypted Notes Vault
```

---

## 2. Environment Variables Specification

### Backend (`backend/.env`)

| Variable | Required | Production Value / Pattern | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enforces production error shielding, HSTS, and logging |
| `PORT` | **Yes** | `5001` | TCP port Express binds to internally |
| `DATABASE_URL` | **Yes** | `mysql://user:pass@host:3306/pj_study?sslmode=prefer` | MySQL connection string with connection pooling |
| `FRONTEND_URL` | **Yes** | `https://pjstudy.com` | Allowed CORS origin and default canonical base URL |
| `PUBLIC_APP_URL` | **Yes** | `https://pjstudy.com` | Base URL used in XML sitemaps and social share metadata |
| `JWT_ACCESS_SECRET`| **Yes** | `[Random 64+ char entropy string]` | Cryptographic secret for signing access tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Lifetime of short-lived JWT access tokens |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Lifetime of refresh session records in MySQL |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN` | No | `15m` | Token expiry for password recovery links |
| `EMAIL_VERIFICATION_TOKEN_EXPIRES_IN` | No | `24h` | Token expiry for email verification links |
| `UPLOAD_DIR` | **Yes** | `/var/data/pjstudy/uploads/notes` | Absolute path to persistent volume for study materials |
| `MAX_FILE_SIZE_MB`| No | `25` | Maximum upload ceiling per note document |
| `EMAIL_PROVIDER` | No | `console` \| `smtp` \| `sendgrid` | Active transactional email transport |

### Frontend (`frontend/.env`)

| Variable | Required | Production Value / Pattern | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `https://api.pjstudy.com/api/v1` | Public backend endpoint for Axios client |
| `VITE_PUBLIC_APP_URL`| **Yes** | `https://pjstudy.com` | Base URL for Canonical links and Open Graph tags |

---

## 3. Production Build & Startup Commands

### Frontend Build
```bash
# Install production dependencies
npm --prefix frontend ci

# Lint check (0 errors required)
npm --prefix frontend run lint

# Production compilation (Outputs to frontend/dist)
npm --prefix frontend run build
```

### Backend Startup
```bash
# Install production dependencies
npm --prefix backend ci --omit=dev

# Verify database connection and apply migrations
npx prisma migrate deploy --schema=backend/prisma/schema.prisma

# Launch production server via process manager (PM2 / systemd / Docker)
NODE_ENV=production node backend/src/server.js
```

---

## 4. Database Migration & Rollback Strategy

1. **Production Migrations**:
   - Always run `npx prisma migrate deploy` in production CI/CD pipelines. Never execute `prisma db push` or `prisma migrate reset` in production environments.
2. **Pre-Migration Safety Checklist**:
   - Create a point-in-time database snapshot before running any migration.
   - Run verification in staging with representative data volume to inspect table locks.
3. **Database Backup Protocol (MySQL)**:
   ```bash
   # Automated daily logical backup
   mysqldump -u pj_user -p --single-transaction --quick --routines --triggers pj_study > /backup/mysql/pj_study_$(date +%Y%m%d_%H%M%S).sql
   
   # Enable Binary Logging in my.cnf for Point-in-Time Recovery (PITR):
   # log_bin = /var/log/mysql/mysql-bin.log
   # expire_logs_days = 14
   ```
4. **Restoration Protocol**:
   ```bash
   mysql -u pj_user -p pj_study < /backup/mysql/pj_study_YYYYMMDD_HHMMSS.sql
   ```

---

## 5. File Storage Architecture & Persistence Guidelines

> [!WARNING]
> **Ephemeral Filesystem Risk**: Standard cloud containers (e.g. Heroku, default AWS ECS tasks, Railway ephemeral dynos) reset filesystems on reboot or redeploy. Uploaded note documents stored locally will be permanently lost unless mounted to a persistent volume or object store.

### Persistent Volume Requirements
- Mount a persistent block volume or NFS volume (e.g. AWS EBS, GCP Persistent Disk, DigitalOcean Block Volume) to `/var/data/pjstudy/uploads/notes`.
- Set directory permissions: `chmod 750 /var/data/pjstudy/uploads/notes` and `chown -R node:node`.
- Backup uploaded files daily:
  ```bash
  rsync -avz --delete /var/data/pjstudy/uploads/notes/ /backup/storage/notes/
  ```
- **Future Roadmap**: The storage service layer in `backend/src/services/storage/storage.service.js` is isolated and prepared for seamless swap to an S3/R2 compatible object storage provider without rewriting controllers.

---

## 6. Nginx Reverse Proxy & TLS Configuration

```nginx
server {
    listen 80;
    server_name pjstudy.com api.pjstudy.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pjstudy.com;

    ssl_certificate /etc/letsencrypt/live/pjstudy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pjstudy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory for Vite production build
    root /var/www/pjstudy/frontend/dist;
    index index.html;

    # SPA Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 30M;
    }

    # Sitemap and Robots Proxy to Backend Generator
    location = /sitemap.xml {
        proxy_pass http://127.0.0.1:5001/sitemap.xml;
    }

    location = /robots.txt {
        proxy_pass http://127.0.0.1:5001/robots.txt;
    }
}
```

---

## 7. Monitoring & Production Observability

1. **Liveness & Readiness Probes**:
   - `GET https://api.pjstudy.com/health` returns `HTTP 200 OK` with JSON `{ "status": "healthy", "uptimeSeconds": ... }`.
   - Used by container orchestrators to detect process health.
2. **Request Logging**:
   - Express runs `morgan('combined')` in production, writing standard Apache-style logs with client IP, timestamp, HTTP method, path, status, and user-agent.
3. **Graceful Shutdown**:
   - The application traps `SIGTERM` and `SIGINT` signals, closes HTTP listeners, terminates ongoing database connection pools safely, and exits cleanly within 5 seconds.
