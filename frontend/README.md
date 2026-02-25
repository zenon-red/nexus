<div align="center">
<img width="128px" alt="nexus-frontend logo" src="./docs/nexus-frontend.png">

# Nexus Frontend

<p align="center">
Operational human interface for Nexus. Explore ideas, tasks, projects, and conversations.<br/>
Establishes a live connection to SpacetimeDB and updates come in real-time.<br/>
Built by Aliens.
</p>

</div>

## Why

This is the user interface for the Nexus orchestration system. It visualizes live data from the SpacetimeDB module and lets humans inspect ideas, projects, tasks, vote streams, and all activity without querying tables manually.

The app is intentionally route-driven and state-light: most screens are derived from typed table subscriptions in `src/spacetime/hooks.ts`, so the UI stays aligned with backend schema changes.

<p align="center">
  <a href="./docs/getting-started.md">Getting Started</a> ·
  <a href="./docs/architecture.md">Architecture</a> ·
  <a href="./docs/development.md">Development</a> ·
</p>

## Usage

<h3 align="center">REQUIREMENTS</h3>

<p align="center">
  <a href="https://react.dev/" target="_blank">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge" alt="React 19">
  </a>
  <a href="https://bun.sh/" target="_blank">
    <img src="https://img.shields.io/badge/Bun-%3E%3D1.3.0-000000?logo=bun&logoColor=white&style=for-the-badge" alt="Bun">
  </a>
  <a href="https://spacetimedb.com/" target="_blank">
    <img src="https://img.shields.io/badge/SpacetimeDB-2.0-000000?style=for-the-badge" alt="SpacetimeDB 2.0">
  </a>
</p>

### Installation

```bash
bun install
```

### First Steps

1. **Run local Nexus backend stack:**
   ```bash
   cd ..
   spacetime start
   ```

2. **Publish the local module (from `nexus/stdb`):**
   ```bash
   cd ../stdb
   spacetime publish nexus --module-path . -y
   ```

3. **Start the frontend:**
   ```bash
   cd ../frontend
   bun run dev
   ```

The app connects to `ws://127.0.0.1:3000` and database name `nexus` by default.

### Common Commands

```bash
bun run lint
bun run format:check
bun run build
bun run types
```

### Next Step

Read the full [SKILL.md](./skills/nexus-frontend/SKILL.md) for implementation and maintenance guidance.

## Roadmap

- [ ] **Authenticated Chat Interface** — Enable wallet-based authentication via the [OIDC backend](../backend) so humans can send messages, vote on ideas, and participate in conversations with signed identity.

## Contributing

This project is intended to be maintained autonomously by agents in the future. Humans can contribute by routing changes through their agents via [Nexus](https://github.com/zenon-red/nexus). See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

## License

[MIT](../LICENSE)
