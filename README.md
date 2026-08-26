# Data Center Deal Simulation

A moderated, round-based business simulation. Teams sign in with a
shared team code and submit decisions across two rounds; a
moderation ("admin") team manages teams, rounds, scoring rules, and
publishes a leaderboard. Built with Next.js (App Router), TypeScript,
Tailwind CSS, PostgreSQL via Prisma, and Zod — packaged as a single
Docker image with no interactive setup required after boot.

See [`PLAN.md`](./PLAN.md) for the implementation plan, design
decisions, and explicit assumptions made where the brief left
something unspecified.

## Contents

- [Quick start (Docker Compose)](#quick-start-docker-compose)
- [Local development without Docker](#local-development-without-docker)
- [Creating the first administrator](#creating-the-first-administrator)
- [Running the tests](#running-the-tests)
- [Deploying to Koyeb](#deploying-to-koyeb)
- [Architecture](#architecture)
- [Security notes](#security-notes)
- [Scoring model](#scoring-model)

## Quick start (Docker Compose)

Requires Docker and Docker Compose.

```bash
cp .env.example .env      # optional — compose has sane defaults
docker compose up --build
```

This starts a PostgreSQL 16 container and the app container. On boot,
the app container automatically runs `prisma migrate deploy` (safe to
re-run — it only applies pending migrations) before starting the
server. The app is available at <http://localhost:3000> once both
containers report healthy.

Seed reference data (rounds, customers, technical solutions,
commercial models — **no scoring values**) and create the first admin:

```bash
docker compose exec app node node_modules/.bin/tsx prisma/seed.ts
docker compose exec -e ADMIN_LOGIN_IDENTIFIER=admin@example.com \
                    -e ADMIN_PASSWORD='choose-a-strong-password-12+' \
                    app node node_modules/.bin/tsx scripts/seed-admin.ts
```

(`seed:admin` is safe to re-run — it resets that identifier's password,
which is also how you recover admin access later.)

## Local development without Docker

Requires Node.js 20+ and a local PostgreSQL 16 instance.

```bash
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres
npx prisma migrate dev
npm run db:seed
npm run seed:admin        # prompts for admin email + password
npm run dev
```

Useful scripts (see `package.json`):

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run (`start` expects the standalone build layout — see Dockerfile) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests (see below) |
| `npm run prisma:migrate:dev` | Create/apply a migration in development |
| `npm run prisma:migrate:deploy` | Apply pending migrations (non-interactive; what the container runs) |
| `npm run db:seed` | Seed rounds/customers/technical solutions/commercial models |
| `npm run seed:admin` | Create or reset an administrator account |

## Creating the first administrator

There is no public registration for the admin role (teams register
themselves at `/register` — see below). The only way to create an
admin account is `scripts/seed-admin.ts`:

```bash
# Non-interactive (env vars) — ideal for docker exec / CI:
ADMIN_LOGIN_IDENTIFIER=admin@example.com ADMIN_PASSWORD='...' npm run seed:admin

# Interactive (prompts for both, password input is not echoed):
npm run seed:admin
```

It never uses a hardcoded default password — one must always be
supplied, and it's validated against the same password policy used
everywhere else in the app (12+ characters, at least one letter and
one number). Re-running it for an identifier that already exists
resets that account's password and reactivates it, which doubles as
the account-recovery path.

Team accounts are self-registered at `/register` — a team picks a
team name and a team code (no password) and is signed in immediately.
The team code is the only credential; there is nothing else to
remember or reset. `/admin/teams` lets a signed-in admin view
existing teams, edit their name/code, and deactivate/reactivate
access, but no longer creates accounts or resets passwords.

## Running the tests

**Unit tests** (`npm test`) are pure — no database needed. They cover
Zod validation schemas, the scoring rule-matching engine
(`src/lib/scoring-rules.ts`), and password hashing.

**E2E smoke tests** (`npm run test:e2e`, Playwright) exercise the
security-critical paths end to end through a real browser: route
guards, generic (non-enumerating) login errors, session cookie flags,
and role-boundary redirects. They need:

- `npx playwright install chromium` (once), and
- a reachable, **migrated** `DATABASE_URL` (the suite seeds its own
  fixture admin/team accounts via `tests/e2e/global-setup.ts` and is
  safe to re-run).

Playwright starts `next dev` on its own (`E2E_PORT`, default 3100) and
tears it down afterward.

## Deploying to Koyeb

1. **Provision a database.** Create a separate, persistent PostgreSQL
   instance (Koyeb's managed Postgres, or any Postgres you can reach
   over the network). The app container's own filesystem is ephemeral
   and must never be relied on for the database.
2. **Create a Koyeb Service from this repository/Dockerfile.** Koyeb
   builds and runs the `Dockerfile` as-is.
3. **Set environment variables** on the service:
   - `DATABASE_URL` — the connection string from step 1.
   - `NODE_ENV=production`
   - Koyeb sets `PORT` for you; the app reads it (defaults to 3000).
4. **Deploy.** On boot, `docker-entrypoint.sh` runs
   `prisma migrate deploy` against `DATABASE_URL`, then starts the
   server bound to `0.0.0.0:$PORT`. No interactive step is required.
5. **Seed reference data and the first admin**, once, via Koyeb's
   one-off/exec command feature (or `koyeb service exec`):
   ```bash
   node node_modules/.bin/tsx prisma/seed.ts
   ADMIN_LOGIN_IDENTIFIER=... ADMIN_PASSWORD=... node node_modules/.bin/tsx scripts/seed-admin.ts
   ```
6. **Health check.** Point Koyeb's health check at `/api/health` (also
   used by the Docker `HEALTHCHECK` already baked into the image).

The app is proxy-aware: cookies are `Secure` whenever
`NODE_ENV=production`, and all mutations go through Next.js Server
Actions, whose built-in Origin/Host verification works correctly
behind Koyeb's edge proxy without extra configuration in the common
case (a single public hostname). If you front the service with an
additional custom domain/proxy that rewrites the `Host` header, see
Next's `experimental.serverActions.allowedOrigins` in
`next.config.ts`.

## Architecture

```
src/
  app/                  # Routes (App Router). Every /admin/** and
                         # /team/** layout calls requireAdmin()/
                         # requireTeam() — the ONLY source of truth
                         # for role, always re-derived server-side.
  components/           # UI (ui/, layout/, auth/, admin/, team/)
  lib/
    auth/                password hashing, DB-backed sessions,
                          cookies, route guards, login throttling
    data/                 all database reads/writes, grouped by
                          audience — team-safe files never import
                          scoring/audit-log models
    validation/           Zod schemas, re-validated server-side on
                          every mutation
    scoring-rules.ts       pure, unit-tested rule-matching logic
    prisma.ts, env.ts, audit.ts, form-errors.ts, status-labels.ts
prisma/
  schema.prisma          full data model
  migrations/             hand-reviewed SQL migrations
  seed.ts                 reference data only — no scoring rules
scripts/
  seed-admin.ts           first-admin / password-recovery CLI
tests/e2e/                Playwright smoke suite
```

**Authentication** is a custom, database-backed session — not
Auth.js/JWT — because team login is by shared *team code*, which
doesn't map cleanly onto Auth.js's user model, and because a
DB-backed session gives real server-side revocation (session rows,
not just a client-held token). See `PLAN.md` for the full rationale.

**Data separation** is enforced in the data-access layer
(`src/lib/data/*`), not by hiding fields in the UI: team-facing files
(`submissions.ts`, `dashboard.ts`, `reference.ts`) never select or
join `ScoringRule`, `ScoreBreakdown`, `AuditLog`, or another team's
rows. Admin-only files (`scoring.ts`, `results.ts`, `teams.ts`,
`audit.ts`) are only ever imported from `/admin/**` code.

## Security notes

- **Passwords**: bcrypt (via `bcryptjs`, cost 12). Never stored or
  logged in plaintext.
- **Sessions**: random 256-bit token in an `HttpOnly`, `SameSite=Lax`
  cookie (`Secure` in production); only a SHA-256 hash of the token is
  stored server-side. Sessions expire (12h), rotate on login and on a
  rolling basis (~6h) while active, and are revoked immediately when
  an admin deactivates a team or resets a password.
- **Login throttling**: 5 failed attempts locks an account for 15
  minutes (`User.failedLoginCount`/`lockedUntil`), enforced in the
  database so it works correctly even if the app ever runs more than
  one replica.
- **No account enumeration**: an unknown team code/admin identifier,
  a wrong password, a locked account, and a deactivated team all
  produce the exact same error message and a comparable response
  time (a dummy bcrypt comparison runs even when no account exists).
- **CSRF**: every mutation is a Next.js Server Action, which verifies
  the request's Origin against Host before running; combined with
  `SameSite=Lax` cookies.
- **Authorization**: role is re-derived from the database-backed
  session on every request in every server component, server action,
  and Route Handler — never trusted from the client, and never
  decided by hiding UI alone.
- **Scoring confidentiality**: `ScoringRule`, `ScoreBreakdown`,
  `AuditLog`, and other teams' submissions are only ever queried from
  admin-only code paths (see Architecture above).

## Scoring model

The app ships with **zero active scoring rules** — no values are
invented anywhere in this codebase. An admin defines a
`ScoringModelVersion` (starts `DRAFT`), adds `ScoringRule` rows to it
from `/admin/scoring`, and activates it (only one version may be
`ACTIVE` at a time; a partial unique index on `ScoringModelVersion`
backstops this in the database, not just in application code). An
`ACTIVE` version can also be sent back to `DRAFT` from its detail page
to edit its rules again — while no version is `ACTIVE`, results
calculate to zero. `/admin/results` can then recalculate
`ScoreResult`/`ScoreBreakdown` rows for **Round 2** (the only round
that is ever scored) from whichever model is active. See the comment
block at the top of `src/lib/scoring-rules.ts` for exactly how a
rule's fields are matched against a team's decisions.

None of this is ever visible to a team: scores, breakdowns, rule
definitions, and the leaderboard's internal detail stay behind
`requireAdmin()`. The public `/leaderboard` page only ever renders
rank/team/published-score from the latest **published, visible**
`LeaderboardPublication` snapshot.
