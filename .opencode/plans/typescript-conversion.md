# Plan: incremental JavaScript → TypeScript conversion

**Repo:** `football_matches_API_system` · Express 5 + PostgreSQL · CommonJS
**Goal:** learn TypeScript *and* keep shipping features — so this is an **incremental conversion**, never a rewrite.
**Scale:** 27 JS files, 1,092 lines, 5 entities × 4 layers + auth + scripts.

---

## 0. Ground rules

1. **The server stays runnable after every phase.** No big-bang cutover.
2. **Bottom-up order:** config → types → models → services → controllers → routes → app. Each layer's types exist before the layer above uses them.
3. **Keep the existing architecture.** Classes with `static` methods stay classes; the `routes → controllers → services → models` chain is unchanged. This is a *typing* exercise, not a redesign.
4. **No new runtime dependencies.** Types only.
5. **Every phase ends with `npm run typecheck` passing** and the API behaving identically.
6. **Type the boundaries, not the internals.** `req.user`, request bodies, service→model payloads, error objects. Not every local variable.

### Verified API facts (read from the installed `@types/*`, not guessed)

| Fact | Consequence |
| --- | --- |
| `core.Request extends Express.Request` (express-serve-static-core:413) | Augmenting the global `Express.Request` propagates to `req` in every handler ✓ |
| `req.body: ReqBody` defaults to `any` (core:645) | `req.body` is **untyped** until you pass a generic — bodies must be typed explicitly per handler |
| `pool.query<R extends QueryResultRow>(text, values): Promise<QueryResult<R>>` (pg:216) | Row type generics work. `QueryResultRow = { [column: string]: any }` → **type aliases get an implicit index signature, interfaces do not** → DB row types must be `type`, not `interface` |
| `jwt.verify(token, secret)` returns `JwtPayload \| string` (jsonwebtoken:219) | Must narrow before assigning to `req.user` |
| `SignOptions.expiresIn?: StringValue \| number` where `StringValue` comes from `ms` (jsonwebtoken:43) | A plain `string` from `.env` is **not assignable** → needs a cast, else TS2345 |
| `jsonwebtoken.JwtPayload` = `{ [key: string]: any }` (jsonwebtoken:111) | Needs a cast/narrow into our own payload type |

---

## Phase 0 — Toolchain

**New devDependencies** (versions verified against the registry):

```
typescript@5.9.3      ts-node@10.9.2      @types/node@22
@types/express@5.0.6  @types/pg@8.23.1    @types/jsonwebtoken@9.0.10
@types/bcrypt@6.0.0   @types/cors@2.8.19
```

> **Why TypeScript 5.9.3 and not 7.0.2?** TypeScript 7 is the Go-based compiler. `ts-node` and the whole `@types` ecosystem still assume the 5.x/6.x JS compiler. 5.9.3 is the last 5.x and is what every tutorial assumes. Revisit when `ts-node` catches up.
>
> **Why `ts-node` and not `tsx`?** `tsx` is faster, but `ts-node` is the pattern in every tutorial and can type-check on run. `nodemon --exec ts-node src/app.ts` is the well-trodden path. (`tsx` is a one-word swap later if startup latency bothers you.)

### `package.json`

```json
{
  "name": "football_matches_api_system",
  "version": "1.0.0",
  "main": "dist/src/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/src/app.js",
    "typecheck": "tsc --noEmit",
    "migrate": "ts-node scripts/migrate.ts",
    "check-tables": "ts-node scripts/check-tables.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^18.0.6",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "pg": "^8.23.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^22.0.0",
    "@types/pg": "^8.23.1",
    "nodemon": "^3.1.14",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  }
}
```

**Path consequence:** `rootDir: "."` puts sources in `dist/src/…` and `dist/scripts/…`. That is why `main` and `start` point at `dist/src/app.js`. `migrate` runs from source via `ts-node` so it needs no prior build.

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- `strict: true` → `strictNullChecks` + `noImplicitAny` + `useUnknownInCatchVariables` (TS 4.4+). This is what makes `catch (error)` give `error: unknown`.
- `esModuleInterop: true` → lets you `import express from 'express'` / `import cors from 'cors'` even though the packages use `export =`.
- `skipLibCheck: true` → skips type-checking of `.d.ts` files inside `node_modules`; faster builds and avoids unrelated upstream errors.
- `noUnusedLocals` → catches leftover imports during the conversion (e.g. the dead `authenticateToken` import in `authRoutes`).

### `.gitignore`

```
node_modules
.env
dist
```

---

## Phase 1 — Shared types

### `src/types/index.ts`

> **Rule:** anything that touches the DB or a token is a `type` **alias**, not an `interface` — `QueryResultRow` requires an implicit index signature, which aliases have and interfaces don't. Request bodies stay `interface` (they never hit `QueryResultRow`).

```ts
export type UserRole = 'admin' | 'coach' | 'fan';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type MatchStatus = 'scheduled' | 'in_progress' | 'finished';

export type User = {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
};

export type SafeUser = {
  id: number;
  email: string;
  role: UserRole;
  created_at?: string;
};

export type JwtPayload = {
  userId: number;
  role: UserRole;
  iat?: number;
  exp?: number;
};

export type Tournament = {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;
  created_at: string;
  creator_email?: string | null;
};

export type Team = {
  id: number;
  name: string;
  description: string | null;
  coach_id: number | null;
  created_at: string;
  coach_email?: string | null;
};

export type Application = {
  id: number;
  tournament_id: number;
  team_id: number;
  status: ApplicationStatus;
  created_at: string;
  tournament_name?: string;
  team_name?: string;
  coach_email?: string | null;
};

export type Match = {
  id: number;
  tournament_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  created_at: string;
  tournament_name?: string;
  home_team_name?: string;
  away_team_name?: string;
};

export interface RegisterBody {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateTournamentBody {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTeamBody {
  name: string;
  description?: string;
}

export interface CreateApplicationBody {
  tournament_id: number;
  team_id: number;
}

export interface CreateMatchBody {
  tournament_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date?: string;
}

export interface UpdateMatchResultBody {
  home_score?: number;
  away_score?: number;
  status?: MatchStatus;
}

export interface UpdateApplicationStatusBody {
  status: ApplicationStatus;
}

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
  results?: number;
  message?: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}
```

### `src/types/express.d.ts` — teaching `req.user` to the compiler

```ts
import type { JwtPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
```

- `declare global` + `export {}` → the file must be a module for the global block to work.
- `import type` → type-only import, erased at runtime.
- `user?:` is **optional** because `authenticateToken` only runs on protected routes, so `req.user` is genuinely `undefined` on public ones. This is what makes `req.user!.userId` necessary in controllers (see Phase 5).

### `src/utils/HttpError.ts`

```ts
export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
```

Replaces the current ad-hoc `error.statusCode = 400` pattern. Under `strict`, a caught error is `unknown` and `error.statusCode` is a compile error; a real class gives `instanceof` narrowing.

---

## Phase 2 — Config

### `src/config/env.ts`

```ts
import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  db: {
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 5432),
    database: required('DB_NAME'),
  },
  jwt: {
    secret: required('JWT_SECRET'),
    // `expiresIn` is typed as StringValue | number (a template-literal union from `ms`),
    // so a plain string from .env must be cast. See verified facts table.
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'],
  },
};
```

- `required()` makes a missing `.env` fail **at startup with a clear message**, instead of signing tokens with `undefined` as the secret.
- `dotenv.config()` runs on import, so `process.env` is populated before any `required()` call.

### `src/config/db.ts`

```ts
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { env } from './env';

const pool = new Pool({
  user: env.db.user,
  password: env.db.password,
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
});

pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const result = await pool.query<T>(text, params);
  return result;
}

export default { query };
```

- `export default { query }` keeps the existing `db.query(...)` call shape → **zero call-site changes in the models**.
- The `err` parameter is now **required** — this is the bug from `db.js:16` that TS would have flagged as TS2304 `Cannot find name 'err'`.
- `pool.query<T>` gives typed `rows` in every model.

---

## Phase 3 — Models

**Pattern (identical in all five):** keep the class, add return types, type the row generic.

### `src/models/teamModel.ts`

```ts
import db from '../config/db';
import type { Team } from '../types';

class TeamModel {
  static async create({
    name,
    description,
    coach_id,
  }: {
    name: string;
    description?: string;
    coach_id: number | null;
  }): Promise<Team> {
    const query = `
      INSERT INTO teams (name, description, coach_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [name, description ?? null, coach_id];
    const result = await db.query<Team>(query, values);
    return result.rows[0];
  }

  static async findAll(): Promise<Team[]> {
    const query = `
      SELECT t.*, u.email as coach_email
      FROM teams t
      LEFT JOIN users u ON t.coach_id = u.id
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query<Team>(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Team | undefined> {
    const query = `
      SELECT t.*, u.email as coach_email
      FROM teams t
      LEFT JOIN users u ON t.coach_id = u.id
      WHERE t.id = $1;
    `;
    const result = await db.query<Team>(query, [id]);
    return result.rows[0];
  }
}

export default TeamModel;
```

### Exact signatures for the remaining models

| File | Class | Signatures |
| --- | --- | --- |
| `src/models/userModel.ts` | plain functions (keep author's style) | `findUserByEmail(email: string): Promise<User \| undefined>` · `createUser(email: string, passwordHash: string, role: UserRole = 'fan'): Promise<SafeUser>` — `db.query<User>` / `db.query<SafeUser>` |
| `src/models/tournamentModel.ts` | class | `create({name, description, start_date, end_date, created_by}: {name: string; description?: string; start_date?: string; end_date?: string; created_by: number \| null}): Promise<Tournament>` · `findAll(): Promise<Tournament[]>` · `findById(id: number): Promise<Tournament \| undefined>` |
| `src/models/applicationModel.ts` | class | `create({tournament_id, team_id}: {tournament_id: number; team_id: number}): Promise<Application>` · `findAll(): Promise<Application[]>` · `findById(id: number): Promise<Application \| undefined>` · `updateStatus(id: number, status: ApplicationStatus): Promise<Application \| undefined>` |
| `src/models/matchModel.ts` | class | `create({tournament_id, home_team_id, away_team_id, match_date}: {tournament_id: number; home_team_id: number; away_team_id: number; match_date?: string}): Promise<Match>` · `findAll(): Promise<Match[]>` · `findById(id: number): Promise<Match \| undefined>` · `updateResult(id: number, {home_score, away_score, status}: {home_score?: number; away_score?: number; status?: MatchStatus}): Promise<Match \| undefined>` |

`userModel` keeps `module.exports = { … }` semantics → `export default { findUserByEmail, createUser };`.

---

## Phase 4 — Services

### `src/services/teamService.ts`

```ts
import TeamModel from '../models/teamModel';
import type { Team } from '../types';

class TeamService {
  static async createTeam(teamData: {
    name: string;
    description?: string;
    coach_id: number | null;
  }): Promise<Team> {
    const newTeam = await TeamModel.create(teamData);
    return newTeam;
  }

  static async getAllTeams(): Promise<Team[]> {
    const teams = await TeamModel.findAll();
    return teams;
  }

  static async getTeamById(id: number): Promise<Team> {
    const team = await TeamModel.findById(id);
    if (!team) {
      throw new Error('Команду не знайдено.');
    }
    return team;
  }
}

export default TeamService;
```

### `src/services/authService.ts` — full file (the auth layer is the interesting one)

```ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel';
import { env } from '../config/env';
import { HttpError } from '../utils/HttpError';
import type { SafeUser, User, UserRole } from '../types';

const register = async (
  email: string,
  password: string,
  role?: UserRole,
): Promise<SafeUser> => {
  const existingUser = await userModel.findUserByEmail(email);
  if (existingUser) {
    throw new HttpError('Користувач з таким email вже існує', 400);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = await userModel.createUser(email, passwordHash, role);
  return newUser;
};

const login = async (
  email: string,
  password: string,
): Promise<{ user: SafeUser; token: string }> => {
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    throw new HttpError('Невірний email або пароль', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new HttpError('Невірний email або пароль', 401);
  }

  const payload = {
    userId: user.id,
    role: user.role,
  };

  const token = jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export default { register, login };
```

### Exact signatures for the remaining services

| File | Signatures |
| --- | --- |
| `src/services/tournamentService.ts` | `createTournament(tournamentData: {name: string; description?: string; start_date?: string; end_date?: string; created_by: number \| null}): Promise<Tournament>` · `getAllTournaments(): Promise<Tournament[]>` · `getTournamentById(id: number): Promise<Tournament>` |
| `src/services/applicationService.ts` | `createApplication({tournament_id, team_id}: {tournament_id: number; team_id: number}): Promise<Application>` · `getAllApplications(): Promise<Application[]>` · `updateApplicationStatus(id: number, status: ApplicationStatus): Promise<Application>` |
| `src/services/matchService.ts` | `createMatch({tournament_id, home_team_id, away_team_id, match_date}: {tournament_id: number; home_team_id: number; away_team_id: number; match_date?: string}): Promise<Match>` · `getAllMatches(): Promise<Match[]>` · `getMatchById(id: number): Promise<Match>` · `updateMatchResult(id: number, {home_score, away_score, status}: {home_score?: number; away_score?: number; status?: MatchStatus}): Promise<Match>` |

**Enum lists become compiler-enforced.** In `matchService.updateMatchResult`, type the array as `const validStatuses: MatchStatus[] = [...]` and in `applicationService` as `const validStatuses: ApplicationStatus[] = [...]`. The compiler then rejects any status the DB enum does not accept.

> ⚠️ **Decision needed (see §"Behaviour changes"):** `matchService` currently allows `'live'`, but the DB enum is `('scheduled','in_progress','finished')`. Typing the array as `MatchStatus[]` makes TS flag `'live'` as invalid — the compiler surfaces a real pre-existing bug. Recommended: align the service to the DB (`in_progress`) and drop `'live'`. If you prefer to keep `'live'`, add it to `MatchStatus` — but then the DB must change too, and `migrate.js` would need a new enum value. **Pick one; do not leave them inconsistent.**

---

## Phase 5 — Controllers

### `src/controllers/teamController.ts` — full file (representative)

```ts
import { type Request, type Response } from 'express';
import TeamService from '../services/teamService';
import type { CreateTeamBody, Team } from '../types';

class TeamController {
  static async create(
    req: Request<{}, {}, CreateTeamBody>,
    res: Response,
  ): Promise<void> {
    try {
      const teamData = {
        ...req.body,
        // `!` — the route always runs authenticateToken, so req.user exists here.
        // The assertion is compile-time only; if the middleware were ever removed
        // this throws at runtime instead of silently writing NULL.
        coach_id: req.user!.userId,
      };

      const newTeam = await TeamService.createTeam(teamData);

      return res.status(201).json({
        status: 'success',
        data: newTeam,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
      return res.status(400).json({
        status: 'error',
        message,
      });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const teams = await TeamService.getAllTeams();

      return res.status(200).json({
        status: 'success',
        results: teams.length,
        data: teams,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
      return res.status(500).json({
        status: 'error',
        message,
      });
    }
  }

  static async getById(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    try {
      const id = Number(req.params.id);
      const team = await TeamService.getTeamById(id);

      return res.status(200).json({
        status: 'success',
        data: team,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
      return res.status(404).json({
        status: 'error',
        message,
      });
    }
  }
}

export default TeamController;
```

**Teaching points in this file**
- `Request<{}, {}, CreateTeamBody>` — the third generic parameter types `req.body`. Without it `req.body` is `any` and nothing is checked.
- `Request<{ id: string }>` — types `req.params`, so `req.params.id` is a `string`.
- `Number(req.params.id)` — the URL gives a string, the service wants a number. **This is a small behaviour clarification** (see §Behaviour changes).
- `error instanceof Error ? error.message : '…'` — narrowing `unknown` to a readable message.
- `...req.body` then `coach_id:` — the override order is preserved, so a client still cannot spoof `coach_id`.

### `src/controllers/authController.ts` — full file

```ts
import { type Request, type Response } from 'express';
import authService from '../services/authService';
import { HttpError } from '../utils/HttpError';
import type { LoginBody, RegisterBody } from '../types';

const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email та пароль є обов\'язковими полями',
      });
    }

    const newUser = await authService.register(email, password, role);

    return res.status(201).json({
      status: 'success',
      message: 'Користувача успішно зареєстровано',
      data: { user: newUser },
    });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
};

const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email та пароль є обов\'язковими полями',
      });
    }

    const result = await authService.login(email, password);

    return res.status(200).json({
      status: 'success',
      message: 'Успішний вхід у систему',
      data: result,
    });
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
};

export default { register, login };
```

### Exact signatures for the remaining controllers

| File | Handlers |
| --- | --- |
| `src/controllers/tournamentController.js` | `create(req: Request<{}, {}, CreateTournamentBody>, res)` → 201 · `getAll(req: Request, res)` → 200 + `results` · `getById(req: Request<{id: string}>, res)` → 200 / 404 |
| `src/controllers/applicationController.js` | `create(req: Request<{}, {}, CreateApplicationBody>, res)` → 201 · `getAll(req: Request, res)` → 200 + `results` · `updateStatus(req: Request<{id: string}, {}, UpdateApplicationStatusBody>, res)` → 200 / 400 |
| `src/controllers/matchController.js` | `create(req: Request<{}, {}, CreateMatchBody>, res)` → 201 · `getAll(req: Request, res)` → 200 + `results` · `getById(req: Request<{id: string}>, res)` → 200 / 404 · `updateResult(req: Request<{id: string}, {}, UpdateMatchResultBody>, res)` → 200 / 400 |

All `catch` blocks become:
```ts
const message = error instanceof Error ? error.message : 'Внутрішня помилка сервера';
```

---

## Phase 6 — Middleware, routes, app

### `src/middlewares/authMiddleware.ts` — full file

```ts
import { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload, UserRole } from '../types';

const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Доступ заборонено. Токен відсутній.',
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    // jwt.verify returns `JwtPayload | string`; a string means it was not a JSON payload.
    if (typeof decoded === 'string') {
      return res.status(403).json({
        status: 'error',
        message: 'Недійсний або прострочений токен.',
      });
    }
    req.user = decoded as JwtPayload;

    next();
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Недійсний або прострочений токен.',
    });
  }
};

const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'У вас немає прав для виконання цієї дії.',
      });
    }
    next();
  };
};

export default { authenticateToken, authorizeRoles };
```

**Payoffs**
- `authorizeRoles('admin', 'coach')` is now **compiler-checked** — `authorizeRoles('admins')` is a compile error.
- `req.user = decoded as JwtPayload` is the *only* place `req.user` is written → the type is enforced in one spot.
- `req.user.role` in `authorizeRoles` is `UserRole`, so `allowedRoles.includes(...)` type-checks.

### `src/routes/teamRoutes.ts` — representative route file

```ts
import express from 'express';
import TeamController from '../controllers/teamController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

// public routes
router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getById);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'coach'),
  TeamController.create,
);

export default router;
```

Other route files are identical in shape. `src/routes/authRoutes.ts` also **drops the unused `authenticateToken, authorizeRoles` import** (dead code today).

### `src/app.ts` — full file

```ts
import express from 'express';
import cors from 'cors';
import db from './config/db';
import { env } from './config/env';

import tournamentRoutes from './routes/tournamentRoutes';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import applicationRoutes from './routes/applicationRoutes';
import matchRoutes from './routes/matchRoutes';

const app = express();
const PORT = env.port;

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/matches', matchRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'Server and Database are running!',
      dbTime: result.rows[0].now,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
```

---

## Phase 7 — Scripts

### `scripts/migrate.ts`

Same SQL, typed calls. Two changes beyond types:

```ts
import db from '../src/config/db';

const createTables = async (): Promise<void> => {
  try {
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'coach', 'fan');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      ... (unchanged enum + table SQL, including the created_by column added earlier)
    `);

    await db.query(`
      ALTER TABLE tournaments
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);   // was: err (undefined -> TS2304)
    process.exit(1);
  }
};

createTables();
```

### `scripts/check-tables.ts`

Same logic, `res.rows.forEach((row) => console.log(` - ${row.table_name}`))` with `row` typed as `{ table_name: string }` via `db.query<{ table_name: string }>(...)`.

---

## Phase 8 — Cleanup, docs, verification

### 8.1 Delete the old JS files
Only after `npm run typecheck` and `npm run build` both pass:

```
git rm src/app.js src/config/db.js src/controllers/*.js src/middlewares/*.js
git rm src/models/*.js src/routes/*.js src/services/*.js scripts/*.js
```

### 8.2 Update `AGENTS.md`
The command table becomes:

| Command | Purpose |
| --- | --- |
| `docker compose up -d` | Starts Postgres 16 — credentials in `docker-compose.yml` |
| `npm run dev` | `nodemon --exec ts-node src/app.ts` |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/src/app.js` |
| `npm run typecheck` | `tsc --noEmit` — **run this before committing** |
| `npm run migrate` | `ts-node scripts/migrate.ts` |
| `npm run check-tables` | `ts-node scripts/check-tables.ts` |
| `npm test` | Stub that always exits 1 |

Also add a line to the Conventions section: *"Domain/DB/token types are `type` aliases (not `interface`) — `pg`'s `QueryResultRow` requires an implicit index signature."* And note `src/types/express.d.ts` is where `req.user` is declared.

### 8.3 Verification (no test suite exists, so this is the check)

```bash
npm install
npm run typecheck          # 0 errors
npm run build              # dist/ produced
npm run dev                # server starts on :5000

curl -s localhost:5000/api/health        # status ok + dbTime
npm run migrate
npm run check-tables       # 5 tables
```

Then the full auth flow:

```bash
curl -s -X POST localhost:5000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"email":"coach@example.com","password":"pass1234"}'
curl -s -X POST localhost:5000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"coach@example.com","password":"pass1234"}'      # → data.token

TOKEN=<paste>
curl -s -X POST localhost:5000/api/v1/teams -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Dynamo Kyiv"}'
curl -s localhost:5000/api/v1/teams            # coach_email populated
curl -s -X POST localhost:5000/api/v1/tournaments -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Cup 2026"}'
curl -s localhost:5000/api/v1/tournaments     # creator_email populated
curl -s -X POST localhost:5000/api/v1/teams -H "Content-Type: application/json" \
  -d '{"name":"No Auth"}'                      # → 401
curl -s -X POST localhost:5000/api/v1/matches -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tournament_id":1,"home_team_id":1,"away_team_id":1}'   # → 400 "сама проти себе"
```

**Behaviour parity checklist** (every one must still hold):

| Check | Expected |
| --- | --- |
| No token on a protected route | 401 |
| Invalid/expired token | 403 |
| Valid token, wrong role | 403 |
| Wrong email/password | 401 |
| Duplicate email on register | 400 |
| `GET /api/v1/applications` without a token | 401 |
| `GET` on tournaments/teams/matches | public, 200 |
| `results` present on all list endpoints | yes |
| Response envelope `{status, data, results?}` / `{status, message}` | unchanged |
| `coach_id` / `created_by` written from the token | non-NULL |
| `npm test` | still exits 1 (stub untouched) |

---

## Behaviour changes (intentional, small)

| # | Change | Why | Risk |
| --- | --- | --- | --- |
| 1 | `req.params.id` is now `Number(...)` before reaching the service | `req.params.id` is a string; the service/model want a number | Very low — Postgres rejected non-numeric ids before too |
| 2 | `matchService` valid statuses become `MatchStatus[]` | forces the `'live'` vs `'in_progress'` mismatch to be resolved | **Needs your decision** — align to the DB, or change the DB |
| 3 | Missing `JWT_SECRET`/`DB_*` now aborts startup with a message | fail fast instead of signing with `undefined` | Low — you always have a `.env` |
| 4 | `error.statusCode = 400` becomes `new HttpError(msg, 400)` | `unknown` catch blocks cannot have arbitrary properties | None — same status codes |
| 5 | `authRoutes` drops its unused middleware import | dead code | None |

---

## Risks

- **`ts-node` startup is ~1–2 s slower** than plain `node`. Acceptable for dev; production uses the compiled `dist/`.
- **`dist/` must be gitignored** — otherwise compiled JS churns the repo.
- **Type aliases vs interfaces** — one rule, stated above. If you write `interface Team`, `db.query<Team>` fails with "Index signature for type 'string' is missing in type 'Team'".
- **`req.user!`** — the non-null assertion. It is compile-time only; if the middleware is ever removed from a route you get a runtime `TypeError` (loud), not a silent NULL (quiet). That is the intended failure mode.
- **No safety net for the conversion** — there is no test suite, so each phase must be verified by the checklist above before the next one starts. If you want a real net, add a test runner *first* (e.g. `vitest` + `supertest`); that is a separate, worthwhile follow-up.

---

## Out of scope (do NOT bundle into this conversion)

1. `POST /api/v1/auth/register` accepts an arbitrary `role` → **privilege escalation**. Needs runtime validation (`zod`, or an explicit allowlist check), not types. Highest-priority follow-up.
2. `src/config/db.ts` — the `pool.on('error')` `err` bug is fixed automatically by the conversion.
3. `match_status` DB enum vs service list → resolved as part of Phase 4 (decision #2).
4. Adding ESLint / Prettier — none exist today; TS's compiler covers a lot but not style.
5. Adding a real test runner — high value, separate task.
6. Restructuring into repositories/DI, or switching to Prisma/Drizzle. The raw-SQL model layer is fine for this project.

---

## Suggested commit sequence (Conventional Commits, matching repo style)

```
chore(ts): add TypeScript toolchain, tsconfig and npm scripts
feat(types): add shared domain types and Express request augmentation
refactor(config): convert database pool to TypeScript with typed query helper
refactor(models): convert models to TypeScript with typed row generics
refactor(services): convert services to TypeScript with typed payloads
refactor(controllers): convert controllers to TypeScript with typed request bodies
refactor(auth): convert auth middleware and service to TypeScript
refactor(routes): convert routes and app entrypoint to TypeScript
refactor(scripts): convert migration and check-tables scripts to TypeScript
chore: remove converted JavaScript sources
docs(agents): update AGENTS.md for the TypeScript workflow
```

---

## Effort estimate

| Phase | Files | Rough effort |
| --- | --- | --- |
| 0 Toolchain | 3 | 30 min |
| 1 Types | 3 | 45 min |
| 2 Config | 2 | 20 min |
| 3 Models | 5 | 60 min |
| 4 Services | 5 | 60 min |
| 5 Controllers | 5 | 75 min |
| 6 Middleware/routes/app | 7 | 45 min |
| 7 Scripts | 2 | 20 min |
| 8 Cleanup/docs/verify | — | 30 min |
| **Total** | **27** | **≈6–7 h** |

Spread across several sessions, each phase is a self-contained, shippable step.
