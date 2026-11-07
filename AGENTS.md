# AGENTS.md

Monorepo for a football tournament management project.

- `backend/` — Express 5 + PostgreSQL REST API, TypeScript (CommonJS).
- `frontend/` — Vite + React + TypeScript SPA (scaffold only; not wired to the API yet).
- `docker-compose.yml` — Postgres 16 for the backend (run from the repo root).

Per-package agent instructions live in `backend/AGENTS.md` and `frontend/AGENTS.md`.
They are placeholders for now — fill them in as each package is set up.

## Commands

| Command | Purpose |
| --- | --- |
| `docker compose up -d` | Starts Postgres 16 (from the repo root) |
| `cd backend && npm run dev` | API on `PORT` (default 5000) |
| `cd backend && npm run typecheck` | `tsc --noEmit` |
| `cd backend && npm run migrate` | Creates enums and tables |
| `cd frontend && npm run dev` | Vite dev server (default 5173) |
| `cd frontend && npm run build` | Type-check + production build |

Backend setup (`.env`, layout, request flow, conventions) belongs in
`backend/AGENTS.md`; frontend details belong in `frontend/AGENTS.md`.

## Conventions

- Backend code comments and user-facing API messages are Ukrainian.
- Git commit messages are English, Conventional Commits.
- Each package owns its `node_modules` and build output; keep both out of git
  (see the root `.gitignore`).
