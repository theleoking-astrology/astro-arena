# Astro Arena Architecture

Astro Arena is a Vite-powered Vue 3 single-page application that renders a cinematic 3D astrology experience on the web. The codebase follows an engine/game/ui separation to keep rendering, simulation, and presentation decoupled.

## High-Level Overview

- `src/main.ts` bootstraps the Vue SPA and mounts the root layout.
- `src/ui/` contains Vue components and Composables for user interface flows.
- `src/game/` (future) holds game state orchestration (currently thin; logic lives in UI for rapid iteration).
- `src/engine3d/` implements the Three.js-based rendering engine and utilities (renderer, scene graph, post-processing, quality detection, loops).
- `src/data/` contains deterministic content for zodiac/aspect trials.
- `src/utils/` provides shared helpers (event bus, math, device detection).

### Rendering Pipeline

The 3D arena is rendered through Three.js r169:

1. `detectQuality()` (in `src/engine3d/Quality.ts`) inspects the GPU tier and produces a `QualityState`.
2. `makeRenderer()` (in `src/engine3d/Renderer.ts`) builds the WebGL renderer with tone mapping, shadows, and DPR scaling based on quality.
3. `buildScene()` (in `src/engine3d/SceneGraph.ts`) constructs the stage, avatars, pedestals, and post-processing passes.
4. `GameLoop` (in `src/engine3d/Loop.ts`) orchestrates fixed-step updates (60Hz) and per-frame renders.
5. `Game3D.vue` binds UI interactions to engine events, drives quality/resolution changes, and cleans up resources on exit.

### Data Flow

```plaintext
UI (Vue components) ── emits actions ──► Game Logic (within UI reactive state)
                                          │
                                          ▼
                                    Engine3D modules
                                          │
                                          ▼
                                   Three.js scene + renderer
```

- UI components use local reactive state for session-scoped data (score, streak, timers).
- Engine modules expose factory functions and classes; they receive DOM primitives (`canvas`) and return disposable handles.
- Computed properties translate engine/game state back to UI elements (HUD, cards, buttons).

## Styling and Assets

- Global CSS lives in `src/style.css`. Component-scoped styles use `<style scoped>` and prefer CSS variables for theming.
- Fonts are loaded via Google Fonts (`Press Start 2P`). High-DPI icons, manifest, and future PWA assets belong in `public/`.

## Testing Strategy

- Unit tests run via Vitest (`tests/`). Core engine utilities (event bus, game loop) have dedicated spec files.
- Visual regressions will be covered by Playwright smoke tests (coming soon).

## Build & Deployment

- Build command: `npm run build` (executes `vue-tsc -b` followed by `vite build`).
- CI pipeline (GitHub Actions) enforces typecheck, lint, test, and build.
- Vercel deployment uses `vercel.json` for SPA rewrites and security headers (Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy).

## Observability

- Structured logging hooks live inside engine modules (currently minimal). Add instrumentation via `console` gating or integrate a logger before shipping telemetry.
- For performance diagnostics, use `stats.js` instrumentation in development only.

## Security Posture

- No authentication yet; treat all API surfaces as public.
- Avoid logging PII; future backend integration should validate payloads using shared schemas under `/common/` once introduced.

## Conventions

- TypeScript strict mode everywhere.
- Relative imports avoided in favor of `@/` alias.
- Vue components named in PascalCase; composables in camelCase prefixed with `use`.
- No direct DOM mutations outside of `onMounted`/`onBeforeUnmount`; prefer refs and engine APIs.


