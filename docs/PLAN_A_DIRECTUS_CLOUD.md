# Plan A - Directus Cloud 중심 (Reference)

## Purpose
- Managed CMS with minimal ops.
- Allows runtime API usage (near real-time updates).
- Suitable when convenience is more important than cost.

## Branch Point From `MASTERPLAN.md`
- Common parts: Part 0 to Part 4 are shared.
- Plan-specific part: hosting and delivery strategy.
- Key difference from Plan C: runtime API access is allowed.

## Architecture (Plan A)
- Astro: managed hosting with runtime support (e.g., SSR/Edge capable host)
- CMS/API: Directus Cloud
- DB: Supabase (or Directus-managed Postgres)
- Automation: Webhooks or platform build hooks

## Core Workflow
1) Editor publishes in Directus Cloud
2) Site reads data at runtime (or build time if needed)
3) Optional webhook triggers builds for static pages

## Decisions (Plan A)
- Runtime API access is allowed on the public site.
- API keys handled by the hosting platform's secrets.
- Directus Cloud is paid (cost trade-off for convenience).

## Pros / Cons
Pros
- Real-time updates possible.
- Minimal server maintenance.

Cons
- Higher cost than Plan C.
- Vendor dependency on Directus Cloud.

## Notes
- This is a reference plan only.
- Current project uses Plan C: `PLAN_C_GITHUB_PAGES.md`.
