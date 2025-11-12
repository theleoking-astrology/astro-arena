# Astro Arena

Astro Arena is a cinematic astrology experience that blends retro 2D puzzles with a photoreal Three.js battleground. Built with Vite + Vue 3, the app auto-tunes fidelity for every device while preserving the neon aesthetic of High Vibe TV.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and the arena will auto-ignite with GPU-aware settings. A loading overlay handles progressive boot and recovers gracefully from WebGL context loss.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Launch Vite dev server with hot-module reloading |
| `npm run build` | Type-check via `vue-tsc` and build production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (Vue + TypeScript) in strict mode |
| `npm run typecheck` | `tsc --noEmit` for project references |
| `npm run test` | Vitest unit suite (EventBus, GameLoop, future modules) |

Husky + lint-staged guard commits with format + lint, and GitHub Actions mirrors the full CI (typecheck → lint → test → build).

## Deployments

- **GitHub**: push to `theleoking-astrology/astro-arena` (`main` protected with mandatory CI).
- **Vercel**: connect the repo to the team [`theleoking-astrologys-projects`](https://vercel.com/theleoking-astrologys-projects), project name `astro-arena`.
  - Framework preset: Vite.
  - Build command: `npm run build`.
  - Output directory: `dist`.
  - Environment is an SPA: rewrites + security headers are declared in `vercel.json`.
  - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets for preview comments (`.github/workflows/vercel-preview.yml`).
- Health check: after deploy, open the root route; the loading overlay confirms readiness.

## Visual & Performance Highlights

- Dynamic GPU tier detection with device heuristics (`detectQuality` + `detectDeviceQuality`) clamps DPR per hardware and honors `prefers-reduced-motion`.
- Context-loss safe: `Game3D.vue` rebuilds renderer/scene on `webglcontextrestored`, pauses timers when the tab hides, and resumes gracefully.
- Cinematic loading overlay with progress bar + retry handling powered by `LoadingOverlay.vue`.
- Animation attenuation for lower-tier devices to maintain 60fps without sacrificing style.
- SPA rewrites/security headers via `vercel.json` (Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy).

## Code Structure

```
src/
  ui/            Vue components (3D arena UI, overlays)
  engine3d/      Renderer, scene graph, quality scaler, loop
  data/          Zodiac/aspect content payloads
  utils/         Shared utilities (event bus, device heuristics)
tests/            Vitest suites mirroring engine utilities
public/          Icons, manifest, optional HDRI/environment assets
docs/adr/        Architecture decision records
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the canonical layering map.

## Assets & Customization

- Drop a custom HDRI in `public/env/arena.hdr` for bespoke lighting.
- Add Draco/Basis decoders under `public/draco` or `public/basis` to unlock compressed geometry/textures.
- Update `src/engine3d/Quality.ts` to tweak bloom/shadow/pipeline presets.
- Extend `src/data/zodiac` and `src/data/aspects` to craft new trials without touching renderer internals.

## Accessibility

- Match `prefers-reduced-motion` to temper animation amplitudes.
- Loading overlay communicates state via `role="status"`/aria-friendly copy.
- Future iterations will expand keyboard UX in the 3D arena (tracked in backlog).

---

© 2025 Hypergate AI — Cosmic Intelligence Division
