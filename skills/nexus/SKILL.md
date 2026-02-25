---
name: nexus
description: The orchestration engine powering collaboration between external agents and ZŌE. Monorepo with SpacetimeDB, Deno backend, and React frontend.
---

# Nexus

## Overview

Nexus is the central coordination system for the ZENON Red organization. It orchestrates tasks, ideas, projects, and agent activities through a real-time SpacetimeDB backend with a Deno API gateway and React frontend.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Database | SpacetimeDB (Rust) |
| Backend | Deno v2.x (TypeScript) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |

## Architecture

```
nexus/
├── stdb/           # SpacetimeDB module (Rust)
│   ├── src/
│   │   ├── lib.rs      # Module entry, reducers
│   │   ├── tables/     # Table definitions
│   │   └── helpers/    # Auth, thresholds, activity
│   └── scripts/        # Code generation
├── backend/        # Deno API gateway
│   ├── src/            # API routes, handlers
│   └── deno.json       # Tasks and config
├── frontend/       # React web UI
│   ├── src/
│   │   ├── routes/     # Page components
│   │   ├── spacetime/  # Generated SDK + hooks
│   │   └── components/ # UI components
│   └── package.json
└── skills/nexus/   # This file
```

## Development

### Prerequisites

- Bun v1.3.9+
- Deno v2.x
- Rust stable
- SpacetimeDB CLI

### Setup

```bash
git clone https://github.com/zenon-red/nexus.git
cd nexus

# Frontend
cd frontend && npm install

# Backend (Deno caches automatically)
cd backend && deno task check

# SpacetimeDB
cd stdb && cargo build
```

### Commands

| Task | Command |
|------|---------|
| **Frontend** | |
| Dev server | `cd frontend && npm run dev` |
| Build | `cd frontend && npm run build` |
| Lint | `cd frontend && npm run lint:all` |
| Type check | `cd frontend && npm run typecheck` |
| **Backend** | |
| Dev server | `cd backend && deno task dev` |
| Check | `cd backend && deno task check` |
| Lint | `cd backend && deno task lint` |
| Test | `cd backend && deno task test` |
| **SpacetimeDB** | |
| Build | `cd stdb && cargo build` |
| Check | `cd stdb && cargo check` |
| Lint | `cd stdb && cargo clippy -- -D warnings` |
| Test | `cd stdb && cargo test` |
| Generate SDK | `cd stdb && ./scripts/generate.sh` |

### SpacetimeDB Workflow

1. Start local server: `spacetime start`
2. Publish module: `cd stdb && spacetime publish nexus`
3. Generate TypeScript SDK: `./scripts/generate.sh`

The generated SDK appears in `frontend/src/spacetime/generated/`.

## Key Files

| File | Purpose |
|------|---------|
| `stdb/src/lib.rs` | SpacetimeDB module entry, reducer definitions |
| `stdb/src/tables/` | Database table structs |
| `backend/deno.json` | Deno tasks and configuration |
| `frontend/src/spacetime/hooks.ts` | React hooks for SpacetimeDB |
| `frontend/src/routes/` | Page components |

## Agent Guidelines

### SpacetimeDB Patterns

- Tables are defined in `src/tables/` with `#[spacetimedb::table]` attribute
- Reducers go in `src/lib.rs` or relevant table modules
- Always run `./scripts/generate.sh` after schema changes
- Use `Identity` for auth - no external auth in stdb

### Frontend Patterns

- Use `@tanstack/react-router` for routing
- SpacetimeDB hooks in `src/spacetime/hooks.ts`
- Components use shadcn/ui from `@zenon-red/ui`
- Tailwind CSS v4 for styling

### Backend Patterns

- Deno tasks in `deno.json`
- External API integrations go in `backend/src/`
- Use Deno's built-in TypeScript support

### Common Pitfalls

- **Don't edit generated files**: `frontend/src/spacetime/generated/*` is auto-generated
- **Run generation after schema changes**: Otherwise TypeScript types will be out of sync
- **Check all three components**: CI runs frontend, backend, and stdb checks in parallel
- **Use conventional commits**: `feat[scope]: description` format required
