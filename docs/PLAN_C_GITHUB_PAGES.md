# Plan C - GitHub Pages (Yoojasalon)

## Purpose
- Lowest cost hosting with reliable static delivery.
- Supabase Studio, light admin UI, or CLI for publishing and query/analysis.
- Build-time data fetch (no runtime DB access on the public site).

## Branch Point From `MASTERPLAN.md`
- Common parts: Part 0 to Part 4 are shared.
- Plan-specific part: Part 5 (hosting and deployment).
- Key constraint: GitHub Pages is static only, so all data must be fetched at build time.

## Architecture (Plan C)
- Astro: GitHub Pages (static hosting)
- Data entry: Supabase Studio + light admin UI + CLI scripts
- Admin UI: Astro page with client-side Supabase SDK
- DB/Storage: Supabase (managed Postgres + Storage)
- Automation: GitHub Actions (build + deploy)

## Core Workflow
1) Editor writes in light admin UI, Supabase Studio, or CLI
2) Build is triggered (manual or scheduled)
3) Actions fetches data from Supabase at build time
4) Static site deploys to GitHub Pages

## Decisions (Plan C)
- Build-time fetch only (no runtime DB access).
- GitHub Actions Secrets store API keys.
- Scheduled builds as a fallback (e.g. daily) plus manual trigger.
- Admin UI uses Supabase anon key; RLS must enforce write access.
- No GitHub tokens in the browser.

## Implementation Steps
1) Confirm data model and category mapping
   - Reference: `MIGRATION_WORKFLOW.md`
2) Set up Supabase
   - Create tables and fields
3) Build light admin UI (write/edit)
   - Supabase Auth + RLS
4) Define read-only API usage
   - Filters, sort, pagination rules
5) Astro SSG integration
   - Build-time data fetch and page generation
6) GitHub Actions workflow
   - Manual trigger + schedule trigger
7) Migration test (10 posts)
8) Full migration + verification

## Reference
- Light admin UI spec: `LIGHT_ADMIN_UI.md`

## Constraints
- New content appears only after a build.
- Public site must not access DB directly.
- Real-time features require a separate service.

## Cost Notes (Plan C)
- GitHub Pages: free
- Supabase: free tier available

## Project Scope (Yoojasalon)
- Plan C is selected for this project.
