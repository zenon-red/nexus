# Getting Started

## Prerequisites

- Bun >= 1.3
- SpacetimeDB CLI
- A local Nexus module published as `nexus`

## Install

```bash
cd frontend
bun install
```

## Run Local Stack

Start SpacetimeDB and publish the module from repo root:

```bash
spacetime start
cd stdb
spacetime publish nexus --module-path . -y
```

Start the frontend:

```bash
cd ../frontend
bun run dev
```

Open the dev server URL printed by Vite.

## Connection Defaults

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| Host | `ws://127.0.0.1:3000` | `VITE_SPACETIME_HOST` |
| Database | `nexus` | `VITE_SPACETIME_MODULE` |
| Token storage | `localStorage["nexus_token"]` | - |

Copy `.env.example` to `.env` and customize for production:

```bash
cp .env.example .env
```

**Note**: The token stored is a SpacetimeDB session identity token (auto-generated on first connection), not an OIDC JWT. The frontend currently connects directly to SpacetimeDB for read-only access to public tables.
