# AGENTS.md

Express 5 + PostgreSQL REST API for football tournament management (tournaments, teams, applications, matches). CommonJS, no TypeScript.

Code comments and all user-facing API messages are in **Ukrainian** — keep new ones Ukrainian. Git commit messages are English (Conventional Commits).

## Commands

| Command | Purpose |
| --- | --- |
| `docker compose up -d` | Starts Postgres 16 (container/db `tournament_db`, port 5432, volume `pgdata`). Credentials are in `docker-compose.yml`. |
| `npm run dev` | `nodemon src/app.js` — API on `PORT` (default 5000) |
| `npm run migrate` | `node scripts/migrate.js` — creates enums and tables |
| `node scripts/check-tables.js` | Lists tables in the DB (not wired into `package.json` scripts) |
| `npm test` | Stub that always exits 1 |

There is **no test suite, linter, formatter, typechecker, or CI** in this repo. Don't add or run them unless asked.

`npm install` compiles `bcrypt` natively (node-gyp); on Windows this may need a C++ build toolchain.

## Setup

`.env` is not committed and there is no `.env.example` — create it before running anything:

```
PORT=5000
DB_USER=postgres
DB_PASSWORD=<see docker-compose.yml>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tournament_db
JWT_SECRET=<any random string>
JWT_EXPIRES_IN=24h
```

`src/config/db.js` reads the `DB_*` vars; `JWT_SECRET` / `JWT_EXPIRES_IN` are read in `src/services/authService.js` and `src/middlewares/authMiddleware.js`. `dotenv` is loaded inside `src/config/db.js` and `src/app.js`.

## Layout & request flow

`src/routes/<entity>Routes.js` → `src/controllers/<entity>Controller.js` → `src/services/<entity>Service.js` → `src/models/<entity>Model.js` → `src/config/db.js`.

- Entities: `tournament`, `team`, `application`, `match` (plus `auth` / `user`).
- SQL lives only in models and is always parameterized (`$1`, `$2`) — never interpolate request data.
- `src/config/db.js` exports a single `query(text, params)` over one `pg` Pool; no client/transaction access.
- Routes mount under `/api/v1/*` in `src/app.js`; `GET /api/health` checks server + DB.
- `src/app.js` calls `app.listen()` on import, so importing it starts a server.

## Conventions

- Response envelope: `{ status: 'success', data, results? }` / `{ status: 'error', message }`. List endpoints set `results` to the row count.
- Auth is applied per route: `authenticateToken` then `authorizeRoles('admin', ...)`. There is no global auth middleware.
- `GET /` and `GET /:id` on tournaments, teams and matches are public; `GET /api/v1/applications` requires a token.
- Status codes: 401 missing token, 403 invalid token or wrong role (middleware); 400/404/500 from controllers; auth flows use `error.statusCode` when set.
- Validation belongs in the service layer, which throws `new Error('...')`; controllers map that to the response.
- JSON field names are snake_case (`tournament_id`, `team_id`, `home_score`).
- Most layers are `class X { static async ... }`; `authController`, `authService` and `userModel` use plain functions with `module.exports = { ... }` — match the file you are editing.
- Commits follow Conventional Commits: `feat(matches): ...`, `chore(auth): ...`.

## Verification

No automated tests exist, so verify manually:

- `curl localhost:5000/api/health` — server + DB reachability.
- `node scripts/check-tables.js` — schema present.
- Auth flow: `POST /api/v1/auth/register` → `POST /api/v1/auth/login` → send `data.token` as `Authorization: Bearer <token>` on protected routes.

Planned: React frontend later, not started. Don't create it unless asked.
