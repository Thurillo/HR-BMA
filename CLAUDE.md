# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HR-BMA is an ATS (Applicant Tracking System) — a custom internal SPA for managing job candidates with a Kanban board, built with React + Vite (frontend) and Node.js + Express (backend), using MySQL and optional n8n integration. The UI and documentation are in Italian.

## Commands

All commands run from `ats-project/backend/` or `ats-project/frontend/` respectively.

### Backend
```bash
cd ats-project/backend
npm run dev      # Node with --watch (auto-restart on file changes)
npm start        # Production start
```

### Frontend
```bash
cd ats-project/frontend
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### No test suite configured.

## Architecture

### Stack
- **Backend**: Node.js (ESM), Express 5, MySQL2, JWT auth, express-rate-limit
- **Frontend**: React 19, Vite, Tailwind CSS v4, `@hello-pangea/dnd` (Kanban drag-and-drop)

### Backend (`ats-project/backend/`)
- `server.js` — Express entry point; mounts all routes, applies auth middleware, defines field allowlists (`CAMPI_TABELLA`, `CAMPI_SOLA_LETTURA`)
- `db.js` — mysql2 promise-based connection pool; credentials from `.env`
- `middleware/auth.js` — JWT validation; toggled by `AUTH_ENABLED` env var; accepts token as Bearer header or query param
- `config/stati.js` — canonical candidate states (Nuovo, 1° Colloquio, 2° Colloquio, Offerta, Assunto, Scartato) and position states (Aperta, In pausa, Chiusa)
- `routes/` — auth, posizioni (job positions), emailTemplates, sistema (version/auto-update via git)

Public (no auth) endpoint: `POST /api/candidates` — webhook for n8n CV ingestion, rate-limited.

### Frontend (`ats-project/frontend/src/`)
- `context/AuthContext.jsx` — global JWT state; token stored in `localStorage` as `ats_jwt_token`; auto-verifies on mount
- `api/client.js` — centralized fetch wrapper; injects JWT; clears token and reloads on 401; base URL from `VITE_API_URL` env var
- `App.jsx` — wraps in `<AuthProvider>`; renders Login or main layout (Sidebar + page) based on auth state; page routing via React state (no router library)
- `hooks/useApi.js` — loading/error wrapper around API calls
- `config/stati.js` — mirrors backend state constants for frontend use

### Pages
| Page | File | Purpose |
|------|------|---------|
| Candidati | `pages/PaginaCandidati.jsx` | Kanban board with drag-and-drop |
| Posizioni | `pages/PaginaPosizioni.jsx` | Job positions CRUD |
| Email | `pages/PaginaEmail.jsx` | Email templates per candidate phase |
| Aggiornamenti | `pages/PaginaAggiornamenti.jsx` | Version check & auto-update trigger |

### Database Schema
Four tables: `candidates`, `positions`, `position_candidates` (many-to-many), `email_templates`. See `ats-project/README.md` for full schema and `database/migration_email_templates.sql` for the email templates migration.

## Environment Setup

Create `ats-project/backend/.env`:
```
PORT=3001
DB_HOST=<host>
DB_PORT=3306
DB_NAME=ats_database
DB_USER=ats_user
DB_PASSWORD=<password>
JWT_SECRET=<secret>
AUTH_ENABLED=true
ADMIN_USER=admin
ADMIN_PASSWORD=<password>
```

Optionally create `ats-project/frontend/.env`:
```
VITE_API_URL=http://localhost:3001
```
