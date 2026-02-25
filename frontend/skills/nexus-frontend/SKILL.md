---
name: nexus-frontend
description: Maintain and extend the Nexus React frontend in `nexus/frontend`. Use when implementing UI routes/components, updating SpacetimeDB-driven views, regenerating bindings, or debugging frontend build/runtime issues tied to the Nexus orchestration interface.
---

# Nexus Frontend

## Scope

This skill covers work inside `nexus/frontend` only.

## Tech and Runtime

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- SpacetimeDB client via `spacetimedb/react`
- Bun package/runtime commands

## Key Files

- `src/main.tsx` - route table and app bootstrap
- `src/spacetime/Provider.tsx` - connection host/db/token behavior
- `src/spacetime/hooks.ts` - typed table selectors, enums, presence helpers
- `src/routes/*` - page-level compositions
- `src/components/domain/*` - domain widgets used by routes

## Development Commands

```bash
cd frontend
bun install
bun run dev
bun run lint
bun run build
bun run types
```

## Required Workflow

1. Implement route/domain/UI changes in `src/`.
2. If `stdb` schema changed, regenerate frontend bindings with `bun run types`.
3. Run `bun run lint` and `bun run build` before handing off.

## Spacetime Rules

- Do not edit `src/spacetime/generated/*` by hand.
- Prefer extending helpers in `src/spacetime/hooks.ts` over ad-hoc row transforms in many files.
- Use enum helpers (for example `TaskStatusEnum`, `IdeaStatusEnum`) for status logic consistency.

## Routing Rules

- Add/modify routes only in `src/main.tsx`.
- Keep route components focused on page orchestration.
- Keep reusable domain rendering in `src/components/domain/*`.

## Common Pitfalls

- Frontend assumes SpacetimeDB is reachable at `ws://127.0.0.1:3000` with module `nexus`.
- Missing local token handling can break reconnection; preserve `nexus_token` behavior in provider.
- Generated bindings can drift from schema if `bun run types` is skipped.
