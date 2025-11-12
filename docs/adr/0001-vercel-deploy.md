# ADR 0001: Deploy Astro Arena via Vercel

- Status: Accepted
- Deciders: Astro Arena Core Team
- Date: 2025-11-12

## Context

Astro Arena is a single-page application (SPA) built with Vite + Vue 3 that targets high-end visual fidelity. The project requires:

- Global edge delivery
- Automated preview builds for feature branches
- First-class support for static assets and SPA rewrites
- Seamless GitHub integration for CI/CD

## Decision

We will deploy Astro Arena using [Vercel](https://vercel.com) under the team account `theleoking-astrologys-projects`.

Key configuration choices:

- Connect the GitHub repo `theleoking-astrology/astro-arena` directly to Vercel.
- Production branch: `main`.
- Build command: `npm run build`.
- Output directory: `dist`.
- SPA rewrites via `vercel.json` to route all paths to `index.html`.
- Security headers enforced in `vercel.json`.
- Preview deployments enabled for every pull request.

## Consequences

- **Pros**
  - Automatic previews unblock creative iteration on cinematic UI.
  - Global CDN ensures low-latency delivery for worldwide audiences.
  - Built-in analytics and performance insights.
  - Seamless integration with GitHub Actions for a single source of CI/CD truth.

- **Cons**
  - Vendor lock-in for preview URLs and build pipeline.
  - Requires Vercel tokens and org/project IDs stored as GitHub secrets for API-triggered deployments.

## Follow-Up Actions

- Add secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) to the GitHub repository.
- Document deployment health checks in the README.
- Evaluate adding custom domains (e.g., `arena.highvibetv.com`) once production is stable.


