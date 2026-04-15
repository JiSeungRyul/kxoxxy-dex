# Deployment Guide

## When To Read This
- Read this when planning real service deployment, hosting, runtime environment variables, or early operating cost.
- Skip this for normal feature work that does not affect deployment or production operations.

## Purpose
- Define the recommended production shape for the current Next.js + PostgreSQL app.
- Keep the early-stage hosting plan cheap without pretending the project is already at large-scale traffic.
- Separate deployment and operating guidance from local DB/bootstrap guidance.

## Current Service Shape
- This repo is not a split frontend/backend system.
- The practical production shape is:
  - one Next.js app server for pages and `app/api/*`
  - one PostgreSQL database
- Current runtime assumptions:
  - `DATABASE_URL` must be set
  - Google OAuth can be enabled through provider env vars
  - persisted product features depend on PostgreSQL-backed authenticated state

## Cheapest Recommended Start

### Core recommendation
- Start with one low-cost Linux VPS.
- Run the Next.js app and PostgreSQL on the same host.
- Put a reverse proxy in front for HTTPS and domain routing.
- Use Cloudflare for DNS and basic edge protection.

### Why this is the default
- The app is already one deployable Next.js server.
- Early traffic is assumed to be low.
- Splitting frontend hosting, backend hosting, and managed DB too early raises monthly fixed cost without solving an immediate bottleneck.

### Tradeoffs
- Lowest monthly cost
- Simplest debugging path
- Highest manual ops responsibility
- App and DB share one failure domain

## Recommended Production Stack
- OS: Ubuntu LTS on a small VPS
- App runtime: Node.js LTS
- Process manager: `systemd` or PM2
- Reverse proxy: Caddy or Nginx
- Database: PostgreSQL 16
- DNS / HTTPS edge: Cloudflare

## Deployment Layout

### App
- Build and run the app as one production process:
  - `npm ci`
  - `npm run build`
  - `npm run start`
- Keep the current App Router + API route structure unchanged.
- Do not split the API into a separate service for the initial production phase.

### Database
- For the first real deployment, run PostgreSQL on the same server.
- Use persistent disk storage and regular backups.
- Keep Docker optional:
  - bare Postgres install is acceptable
  - a Postgres container is also acceptable if the team prefers container-based ops

### Reverse proxy
- Terminate HTTPS at Caddy or Nginx.
- Forward requests to the Next.js app process.
- Keep one production domain first, then add `www` or other aliases later only if needed.

## Environment Variables
- Required:
  - `DATABASE_URL`
- Production auth env:
  - Google OAuth client id
  - Google OAuth client secret
  - service base URL / callback URL related env
- Operational recommendation:
  - keep production env in server-managed secret storage or systemd environment files
  - do not reuse local development env values in production

## First Production Bootstrap
1. Provision the server.
2. Install Node.js and PostgreSQL.
3. Set production env vars.
4. Run:
   - `npm ci`
   - `npm run build`
   - `npm run db:migrate`
   - `npm run db:seed:pokedex`
   - `npm run db:seed:items`
   - `npm run db:seed:moves`
5. Start the app process.
6. Verify the main routes and auth flow.

Important:
- `db:seed:*` is for first bootstrap or intentional catalog refresh, not every deploy.
- `sync:*` is not part of the default deploy pipeline.

## Ongoing Deploy Flow
1. Merge verified changes into `main`.
2. Pull the new revision on the server.
3. Run `npm ci`.
4. Run `npm run build`.
5. Run `npm run db:migrate` if schema changed.
6. Run `npm run db:seed:*` only if a catalog refresh is intentionally part of the release.
7. Restart the app process.
8. Recheck login, persisted routes, and one representative detail route.

## Cost Strategy

### Early low-cost goal
- Keep fixed monthly cost concentrated in:
  - one VPS
  - one domain
- Avoid managed DB, separate app hosting, background worker services, and paid monitoring at the start unless real traffic justifies them.

### What to delay
- Separate database host
- Managed Postgres
- Full observability stack
- Multi-environment staging infrastructure
- Dedicated cache service

### When to upgrade
- Upgrade the architecture after one or more of these become true:
  - traffic is no longer low
  - DB backup/recovery burden becomes uncomfortable
  - auth/session or persisted-state reliability becomes business-critical
  - deploys need lower downtime
  - team-sharing or analytics features increase write/read load noticeably

## Backups And Operations
- Minimum recommendation:
  - daily PostgreSQL backup
  - keep 7 to 14 days of backups
  - verify that restore works at least once
- Track at least:
  - service uptime
  - disk usage
  - memory usage
  - app restart success
- Keep logs simple at first:
  - Next.js process logs
  - reverse proxy access/error logs
  - PostgreSQL logs

## Cheapest Growth Path
1. One VPS with app + DB
2. Same app host, move DB to managed Postgres when ops burden rises
3. Add stronger deploy automation
4. Add error tracking and better monitoring

## Launch Readiness Guide

### Minimum soft-launch threshold
This is the earliest point where a quiet release to friends, portfolio viewers, or a small community is reasonable.

`docs/soft-launch-checklist.md`를 실제 운영 체크리스트로 사용합니다.

- Public browse routes work on the real domain:
  - `/`
  - `/pokedex`
  - `/pokemon/[slug]`
- Google sign-in works on the real domain.
- Protected routes work after sign-in:
  - `/favorites`
  - `/daily`
  - `/my-pokemon`
  - `/teams`
  - `/my-teams`
  - `/my`
- Production bootstrap is repeatable:
  - `npm run db:migrate`
  - initial `db:seed:*`
  - app start/restart
- At least one backup job exists.
- A post-deploy smoke-check flow exists and has passed at least once.
- Session expiry, login failure, and DB connection failure do not collapse into repeated unexplained `500` responses.

### Recommended public-launch threshold
This is the level recommended before broader SNS/community exposure.

- Minimum soft-launch threshold is already satisfied.
- A minimum automated test set exists for:
  - auth session boundary
  - persisted state APIs
  - key repository read paths
- The riskiest oversized files have a first-pass decomposition plan or partial split already applied.
- Provider mode and development fallback are clearly separated in product/ops expectations.
- App restart, DB restore, and deploy rollback are documented well enough for one operator to execute them.
- Production logs are available and readable during failure triage.

### Still optional before launch
These can improve growth, but they are not launch blockers.

- additional OAuth providers
- self-hosted email/password login
- premium billing
- team sharing
- advanced team analysis
- richer collection dashboards

## Best Features To Add Before Or Soon After Launch

### Best before or right after launch
- a lightweight team sharing flow
- a basic team analysis surface:
  - type weaknesses
  - role balance
  - coverage summary
- a stronger collection summary view:
  - by generation
  - by type
  - by shiny count

### Best differentiated direction
The most realistic product differentiation for this repo is:
- Korean-first fan tool UX
- one connected experience across dex, collection, and team building
- beginner-to-mid-level guidance instead of pure encyclopedic depth

### What this means in practice
- prioritize retention features over broad raw data expansion
- favor shareable and account-bound features over adding another large passive info surface
- treat premium ideas as a later layer on top of team, collection, and guidance features rather than as a launch requirement

## Production Boundaries
- Current production recommendation keeps:
  - Next.js app as one service
  - PostgreSQL as the only required stateful dependency
  - Google auth as the only real provider-backed auth flow
- Current production recommendation avoids:
  - service decomposition
  - unnecessary managed services
  - automatic dataset refresh on each deploy
