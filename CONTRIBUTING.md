# Contributing to Astro Arena

Thank you for your interest in elevating Astro Arena to a world-class, cinematic astrology experience. This guide outlines how to propose changes while keeping the codebase stable and production-ready.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Branching Model](#branching-model)
- [Commit Style](#commit-style)
- [Testing Requirements](#testing-requirements)
- [Pull Request Checklist](#pull-request-checklist)

## Code of Conduct

Participation in this project is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). Treat every teammate with respect and collaborate with transparency.

## Development Workflow

1. Fork the repository and clone your fork locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Run tests and linters before pushing:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

## Branching Model

- `main` is always deployable.
- Use feature branches prefixed with your scope, e.g. `feature/improve-dpr-scaling`.
- Squash-merge after approvals to keep the history clean.

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/) so automated changelog and release tooling can parse the history:

- `feat(ui): add animated loading overlay`
- `fix(engine): dispose resize listener on teardown`
- `chore(deps): bump three to 0.170.0`

## Testing Requirements

- Unit tests with Vitest for utilities, composables, and engine modules.
- Integration tests (Playwright) for UI flows when adding or refactoring major features.
- Snapshot tests may be used sparingly for static content.
- All tests run in CI must pass deterministically without external services.

## Pull Request Checklist

- [ ] Description includes context, screenshots, and acceptance criteria.
- [ ] Lint, typecheck, test, and build pass locally.
- [ ] New public APIs are documented (README, ADRs).
- [ ] Security and performance implications are considered and documented.
- [ ] PR title follows Conventional Commits.
- [ ] Vercel preview link attached (auto-commented by CI).

We strive for cinematic quality in every release—thank you for helping us craft the cosmos.


