# AGENTS.md

## Project

This is a TypeScript-only PWA stop-timer game for children at event booths. The primary target device is an iPad in landscape orientation.

## Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- E2E: `pnpm test:e2e`
- Production preview: `pnpm preview`

Use pnpm for this repository. Do not add `package-lock.json` or switch commands back to npm.

## Product Constraints

- Keep the game usable offline after the first online load and PWA installation.
- Store app data locally. Presets and admin PIN currently use `localStorage`.
- Do not add ranking, high-score, user accounts, or server sync unless explicitly requested.
- Admin access is a simple accidental-touch guard, not real security. The player home screen gear opens admin PIN entry via long press.
- Every player should receive `1等`, `2等`, or `3等`. Do not add a losing result.
- Presets must allow changing `targetSeconds`.
- `visibleUntilSeconds` must be less than or equal to `targetSeconds`. Equal means the timer remains visible until the target time.

## UI Guidelines

- Optimize for iPad landscape.
- Use large text, large touch targets, clear color, and simple labels for children.
- Keep player flows simple: preset selection, start, stop, result, retry.
- Keep admin controls dense enough for staff use, but avoid hiding important validation feedback.
- If the UI changes, run Playwright E2E and do a quick visual usability check.

## Implementation Notes

- Core preset validation lives in `src/domain/presets.ts`.
- Defaults live in `src/domain/defaults.ts`.
- Local storage helpers live in `src/domain/storage.ts`.
- The main UI is currently in `src/App.tsx` and `src/App.css`.
- PWA configuration is in `vite.config.ts`.
- E2E tests are in `tests/stoptimer.spec.ts`.

## Documentation

Keep human-facing setup and operation guidance in `README.md`. Keep design requirements and task breakdown in `docs/requirements-and-tasks.md`.
