# Vercel Deployment Playbook

Team: `theleoking-astrologys-projects`  
Project: `astro-arena`

## 1. Connect Repository
1. Visit [Vercel Dashboard](https://vercel.com/theleoking-astrologys-projects).
2. Click **Import Project → Import Git Repository**.
3. Select `theleoking-astrology/astro-arena` and authorize access if prompted.
4. Set the project name to `astro-arena` (slug will match automatically).

## 2. Build Settings
- Framework preset: **Vite**.
- Build command: `npm run build`.
- Install command: `npm install`.
- Output directory: `dist`.
- Root directory: repository root (leave blank).

## 3. Environment
- Environment Variables: none required yet (future secrets land in **Project Settings → Environment Variables**).
- Analytics & Speed Insights: enable if desired.
- Monitoring: Vercel will auto-wire status checks for PRs.

## 4. Git Integration
Ensure the GitHub App is installed for the `theleoking-astrology` org:
1. From Vercel project **Settings → Git**, verify the `main` branch is set as the production branch.
2. Enable **Deploy Previews for every git push**.
3. Copy project identifiers into GitHub secrets for CI preview action:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

## 5. SPA Routing & Security
`vercel.json` already configures:
- SPA rewrites (`/(.*)` → `/index.html`).
- Security headers:
  - `Referrer-Policy: no-referrer`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy` disables camera/microphone/geolocation.

## 6. Smoke Test
1. Once the first deploy finishes, open the production URL (default `astro-arena.vercel.app`).
2. Confirm the loading overlay fades after the first render.
3. Visit `/api/__open-status` to ensure 404 (confirms SPA rewrite), then check the root again.

## 7. Optional Enhancements
- Attach a custom domain (e.g., `arena.highvibetv.com`) via **Domains** tab.
- Enable Vercel Insights dashboards.
- Configure web analytics retention to 30 days minimum.

With this setup the GitHub Actions pipeline and Vercel previews remain in lockstep, giving us auditable, cinematic releases every time `main` turns green.


