# Plan B - Vercel/Netlify 중심 (Reference)

## Purpose
- More deployment features than GitHub Pages.
- Supports serverless functions for lightweight runtime APIs.
- Good balance between flexibility and cost.

## Branch Point From `MASTERPLAN.md`
- Common parts: Part 0 to Part 4 are shared.
- Plan-specific part: hosting and delivery strategy.
- Key difference from Plan C: runtime functions can be used.

## Architecture (Plan B)
- Astro: Vercel or Netlify
- CMS/API: Directus (cloud or self-hosted)
- DB: Supabase (managed Postgres)
- Automation: platform build hooks + webhooks

## Core Workflow
1) Editor publishes in Directus
2) Webhook triggers build on Vercel/Netlify
3) Static site deploys, optional serverless endpoints for extras

## Decisions (Plan B)
- Build-time data fetch is default.
- Runtime API access can be added via serverless functions.
- Cost depends on usage tiers.

## Pros / Cons
Pros
- Preview deployments and easier CI/CD.
- Optional runtime features.

Cons
- Not fully free at scale.
- More moving parts than Plan C.

## Notes
- This is a reference plan only.
- Current project uses Plan C: `PLAN_C_GITHUB_PAGES.md`.
