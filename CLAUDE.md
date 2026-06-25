# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (run from `backend/`)
```bash
npm run dev    # development with nodemon auto-restart
npm start      # production
```
Server runs on **http://localhost:5001**.

### Frontend (run from `frontend/`)
```bash
npm start                # dev server on http://localhost:3000
npm run build            # production build
npm test                 # React Testing Library unit tests (watch mode)
npm run cypress:open     # Cypress interactive test runner
npm run cypress:run      # Cypress headless
```

### Database setup
Connect to PostgreSQL and run `backend/sql/001_create_tables.sql` to create all tables. Drop all tables with `backend/sql/000_drop_tables.sql`.

## Architecture

### Full-stack overview
- **Backend**: Node.js with ESM (`"type": "module"`), Express 5, PostgreSQL via `pg.Pool`
- **Frontend**: React 19, React Router 7, Axios, Bootstrap 5
- Both services must run simultaneously in development

### Backend structure

**Entry point** — `backend/index.js` mounts all routes with a two-layer middleware chain:
1. `authenticateToken` (JWT verification) — applied to all `/api/user`, `/api/companies` routes
2. `authCompanyAccess` (company ownership check) — applied to all `/api/companies/:companyId/*` routes

All company-scoped resources follow the URL pattern `/api/companies/:companyId/[documents|partners|accounts|ai]`.

**Controllers** handle all business logic in `backend/controllers/`. Each controller corresponds to a route file in `backend/routes/`.

**Database** — `backend/db.js` exports a single shared `pg.Pool`. Date columns (type 1082) are parsed as raw strings to avoid timezone issues.

### Frontend structure

**Context providers** (nested in `App.jsx` in this order: `LoadingProvider → AuthProvider → CompanyProvider`):
- `AuthContext` — JWT token + user object, synced to `localStorage`. Provides `login()`, `logout()`, `isAuthenticated`.
- `CompanyContext` — selected company state, synced to `localStorage`. Multi-company: user picks a company on the Companies page before accessing Documents/Partners/Accounts.

**Routing** — `ProtectedRoute` redirects unauthenticated users to `/login`. `PublicOnlyRoute` redirects authenticated users away from `/login` and `/register`. The `AppLayout` (sidebar) wraps Documents, Partners, and Accounts pages.

**API layer** — `src/api/axiosInstance.jsx` is a configured Axios instance that:
- Targets `http://localhost:5001/api`
- Auto-attaches the JWT from `localStorage` as `Authorization: Bearer <token>` on every request
- Redirects to `/login` on 401/403 responses

**Validation** — all form validation rules live in `src/utils/Validators.jsx` as composable rule functions (e.g. `loginRules`, `registerRules`). Frontend validation mirrors backend `express-validator` checks.

**Notifications** — use `src/utils/Notify.jsx` (wraps react-toastify). `ToastContainer` is mounted once in `App.jsx`.

**Virtualized lists** — large tables (documents, partners, accounts) use `react-virtuoso` or `react-window` via the `VirtualizedTableContainer` component to avoid DOM overload.

### AI document processing pipeline

Located in `backend/controllers/aiController.js`:
1. PDF uploaded via `multer` (in-memory buffer)
2. Text extracted with `pdf-parse`
3. If extracted text has <70% printable characters → OCR path: `pdftoppm` converts PDF pages to PNG images → Google Cloud Vision API performs OCR
4. Text is cleaned (collapses whitespace, merges split numbers/words)
5. OpenAI `gpt-4o-mini` extracts structured document fields (document number, date, type, partner, amount, currency) as JSON

Requires `pdftoppm` (from `poppler-utils`) installed on the host system.

### Database schema

`users` → `companies` (one user, many companies) → `documents`, `partners`, `accounts` (all scoped to a company) → `document_lines` (belong to a document).

All foreign keys cascade on delete. The schema targets Latvian accounting software (Jumis) field conventions — column comments reference the Jumis XML field names.

### Environment variables (backend `.env`)
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
JWT_SECRET
OPENAI_API_KEY
GOOGLE_APPLICATION_CREDENTIALS   # path to GCloud service account JSON
```

### Cypress E2E tests

Tests live in `frontend/cypress/e2e/` organized by feature with coded prefixes:
- `LM*` — auth (login, register, user profile)
- `UM*` — companies
- `FDM*` — documents
- `PM*` — partners
- `KP*` — chart of accounts

Run a single spec: `npx cypress run --spec "cypress/e2e/documents/FDM2_add.cy.js"` from the `frontend/` directory.
