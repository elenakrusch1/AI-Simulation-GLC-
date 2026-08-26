# Implementation Plan — Data Center Deal Simulation

## Scope of this pass
Build the full application described in the brief: Dockerized Next.js
(App Router/TypeScript) app, PostgreSQL via Prisma, custom server-side
session auth (team-code and admin login), full round-based decision
flow (Round 1 / Round 2), admin moderation area (teams, rounds,
scoring, leaderboard, audit log, results/export), and a configurable
scoring system that ships with **no active rules** (no invented
values).

## Stack decisions & why
- **Next.js App Router + TS**, output: `standalone` (small Docker
  image, no reliance on `next start` needing full node_modules).
- **Auth**: custom server-side session store in Postgres (`Session`
  table) rather than Auth.js, because:
  - Login is by *shared team code*, not email/OAuth — doesn't map to
    Auth.js's user model without fighting the Prisma adapter's fixed
    schema.
  - The brief explicitly allows "Auth.js **or another secure,
    well-maintained server-side authentication solution**".
  - A DB-backed opaque session token (HttpOnly, Secure in prod,
    SameSite=Lax, rotated on login and periodically) gives us real
    server-side sessions (not just a client-held JWT), server-side
    revocation, and audit-friendly session rows.
- **Password hashing**: `bcryptjs` (pure JS, no native build step —
  keeps the Docker image reproducible without build tools). bcrypt is
  explicitly allowed by the brief.
- **CSRF**: all mutations go through Next.js Server Actions, which
  Next verifies via Origin/Host header checks automatically; we add a
  belt-and-suspenders explicit Origin check helper for any non-Server
  Action POST routes. Combined with `SameSite=Lax` cookies.
- **Validation**: Zod schemas shared by server actions, re-validated
  again inside the Prisma transaction for the two decision rounds
  (defense in depth against races/stale client state).
- **Rate limiting**: per-account `failedLoginCount` / `lockedUntil`
  columns (DB-backed, works across replicas without Redis).
- **Data separation**: team-facing server actions/queries only ever
  `select` team-safe columns and never touch `ScoringRule`,
  `ScoreBreakdown`, `ScoreResult`, `AuditLog`, or other teams' rows.
  This is enforced in the data-access layer (`lib/data/*`), not by
  hiding fields in the UI.

## Assumptions (no answer available from the brief)
1. "Team Rationale" and per-customer rationale are free text, optional,
   max 2000 chars, stored as submitted (no profanity filtering asked
   for).
2. First admin is created via a one-off CLI script
   (`npm run seed:admin`) reading `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   from the environment (or interactive prompt if not set locally) —
   never a hardcoded default password.
3. Round "release" to teams: a round is visible to teams once its
   status is anything other than `NOT_STARTED`. History shows a round
   once it has ever been opened (`openedAt` set), regardless of
   current status, since brief says "released to the team".
4. Leaderboard page is public per the route list, but shows nothing
   until an admin publishes a `LeaderboardPublication` with
   `visible = true`; only the latest visible, non-frozen-vs-frozen is
   irrelevant — we show the latest `visible` publication.
5. "Session rotation where supported" = session token is rotated on
   login and re-issued once at least half its max-age has elapsed on
   an authenticated request (rolling rotation).
6. Playwright is included with a minimal smoke suite (login +
   route-guard checks) per "if practical" — full E2E of every round
   flow is out of scope for this pass given time budget, but the
   harness is ready to extend.
7. Koyeb deployment: single container, `DATABASE_URL` points at an
   external managed Postgres (Koyeb Postgres or any Postgres). The
   container runs `prisma migrate deploy` on boot before starting the
   server (idempotent, non-interactive).

## Build stages (each followed by lint/typecheck/test/build)
1. Repo scaffold: package.json, tsconfig, Next config (standalone),
   Tailwind, ESLint, base app shell, `/api/health`.
2. Prisma schema (full model set from the brief) + initial migration.
3. Auth core: password hashing, session store, login/logout server
   actions for team + admin, middleware route guards, `requireTeam` /
   `requireAdmin` helpers, login-throttling.
4. RBAC-protected route skeletons for every route in the brief
   (server-side guarded, placeholder content where a later stage will
   fill in real logic) + seed script (rounds, customers, technical
   solutions, commercial models, admin seed script).
5. Admin: teams CRUD, rounds lifecycle (open/close/lock), audit log
   writing + viewer.
6. Team Round 1 flow (draft/submit) with server + transactional
   validation.
7. Team Round 2 flow (draft/submit) with server + transactional
   validation, dependent on Round 1.
8. Admin scoring config (model versions + rules, inactive by default),
   results view, manual adjustments, leaderboard publication + public
   leaderboard page, export.
9. Docker/Docker Compose, health checks, non-root user, Koyeb notes.
10. Tests (Vitest unit tests for validation/business rules, Playwright
    smoke), README, `.env.example`, final full verification pass.

## Non-goals for this pass
- No invented scoring numbers — the app ships with zero active
  scoring rules; admins must enter values.
- No public self-registration for either role. **Superseded** — team
  self-registration (no password; the team code is the sole
  credential) was added afterwards at `/register`; see the amendment
  note at the end of this file.
- No client-only enforcement of anything security-relevant.

## Additional decisions made during implementation
8. **Scoring rule matching algorithm** (a design decision, not a
   scoring value): each `ScoringRule`'s target fields
   (customerId/customerRole/technicalSolutionId/commercialModelId)
   are optional wildcards; a rule matches when every field it DOES
   set agrees with a decision (AND) — setting more than one field is
   what makes `COMBINATION` meaningful. Round 1 rules match the
   team's single decision (either slot if customerRole is unset);
   Round 2 rules are matched independently per decision row
   (PRIMARY/SECONDARY), so a role-agnostic rule can award on both.
   `MANUAL_CATEGORY` rules are never auto-matched — they're a labeled
   reference for `ManualScoreAdjustment.reason`. Documented in and
   enforced by `src/lib/scoring-rules.ts` (unit tested).
9. **Prisma major version**: pinned to 6.19.3 rather than the current
   8.x line. Prisma 7 moves the datasource URL out of `schema.prisma`
   into `prisma.config.ts` with a required driver adapter — a much
   larger, riskier change than this project needs; 6.x is the last
   line where `datasource { url = env(...) }` works as documented
   everywhere. A `prisma.config.ts` is still used (for the `seed`
   command, replacing the deprecated `package.json#prisma` key) with
   `dotenv` loaded explicitly, since a config file's presence turns
   off Prisma's implicit `.env` loading.
10. **Docker base image**: Debian "slim" (`node:20-bookworm-slim`)
    rather than Alpine. Prisma's query engine targets glibc; slim
    avoids the Alpine `libc6-compat` shim entirely, which is the base
    Prisma's own docs recommend when in doubt.
11. Verifying the actual `docker build` end-to-end wasn't possible in
    the sandbox this was authored in (its egress policy blocks OS
    package manager hosts — `deb.debian.org`/Alpine's CDN — for
    processes inside a container network namespace; confirmed via
    repeated 403s, not a transient failure). Every other layer WAS
    verified inside a real container on that sandbox's Docker engine:
    `npm ci`, `npm run build` (including confirming every route's
    static/dynamic classification), the `prod-deps` install, and that
    the `prisma`/`tsx` CLIs run correctly from it — and this process
    is exactly what caught issue #12 below. `docker compose config`
    validates cleanly and `postgres:16-alpine`/`node:*` images pull
    and run fine; only the `apt-get install openssl` layer in the
    final image went unverified end-to-end. This is a constraint of
    that sandbox's network policy, not of a normal build host, CI
    runner, or Koyeb's own build service.
12. **Bug found via the Docker build attempt**: `/leaderboard` had no
    auth check to opt it out of Next's static generation, so it was
    being prerendered once at `next build` time — which both crashed
    the build wherever Postgres isn't reachable during the build (any
    normal CI/Docker build, including this project's own) and, more
    importantly, would have baked in a permanently stale "nothing
    published yet" page in production regardless. Fixed with
    `export const dynamic = "force-dynamic"` (also added to
    `/api/health` for the same reason, defensively).
13. **Bug found via unit testing**: `technicalSolutionId`/
    `commercialModelId` on the add-scoring-rule form are only
    rendered for Round 2 rules, so `FormData.get()` returns `null`
    (not `""`) for them on a Round 1 rule — which Zod's `.optional()`
    doesn't accept (only `undefined` is "optional"; `null` is a
    distinct value). Every affected schema was creating a Round 1
    rule silently failing validation with no field-level error
    surfaced anywhere in the UI. Fixed by having every such schema
    accept `null` explicitly, and added a regression test.

## Amendment: self-service teams, Round-2-only scoring, draft revert
Made after the initial pass, at the requester's request:
- **Team self-registration replaces admin-created teams.** Teams pick
  their own name + code at `/register` (public, no admin action) and
  are signed in immediately. Teams have no password at all — the
  `User.passwordHash` column is still populated (shared with admin
  accounts, which do use a password) but with a random, never-issued,
  never-checked value; team login (`loginTeamAction`) authenticates
  purely by team code. `/admin/teams` keeps view/edit-name-or-code/
  deactivate for admins but no longer creates accounts or resets
  passwords (nothing to reset).
  - Trade-off worth being explicit about: the team code is now the
    *only* secret protecting a team's submissions, with no
    rate-limiting on lookups (there is no password to lock out
    against). This is an intentional simplicity-over-security choice
    for this use case — acceptable for a low-stakes internal/workshop
    simulation, not for anything where team codes must resist
    guessing.
- **Only Round 2 is scored.** `AddScoringRuleForm` no longer offers a
  round choice (hardcoded to 2); `/admin/results`' recalculate action
  is now typed to `"round-2"` only. The Round 1 rule-matching code
  path (`computeRoundOneScores`, `roundOneRuleMatches`) is left intact
  and unit-tested but is unreachable from the UI — Round 1 stays a
  pure decision round (customer selection) with no scoring.
- **An ACTIVE scoring model version can be reverted to DRAFT** from
  its detail page, to edit rules again without archiving it. While no
  version is ACTIVE, "Recalculate" refuses to run (existing behavior,
  unchanged) — so results freeze at whatever was last calculated
  until a version is (re-)activated.
