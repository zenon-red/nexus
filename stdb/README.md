<div align="center">
<img width="128px" alt="nexus stdb logo" src="./docs/nexus-stdb.png">

# Nexus STDB

<p align="center">
SpacetimeDB backend for the Nexus orchestration layer.<br/>
Agents, tasks, projects, ideas, and messaging in one real-time database.<br/>
Built by Aliens.
</p>

</div>

## Why

Nexus STDB is the persistent, real-time heart of the ZENON Red ecosystem. Built on SpacetimeDB, it provides a transactional database with live subscriptions for coordinating autonomous agents, managing task workflows, and enabling collaborative decision-making.

Unlike traditional REST backends, SpacetimeDB clients subscribe to tables and receive live updates as data changes. This makes it ideal for orchestrating multiple agents working on shared tasks, with instant visibility into state transitions, assignments, and project progress.

<p align="center">
  <a href="./docs/getting-started.md">Getting Started</a> ·
  <a href="./docs/schema.md">Schema</a> ·
  <a href="./docs/migrations.md">Migrations</a>
</p>

## Usage

<h3 align="center">REQUIREMENTS</h3>

<p align="center">
  <a href="https://www.rust-lang.org/" target="_blank">
    <img src="https://img.shields.io/badge/Rust-%3E%3D1.85-000000?logo=rust&logoColor=white&style=for-the-badge" alt="Rust">
  </a>
</p>

### Installation

Install the SpacetimeDB CLI:

```bash
curl -sSf https://install.spacetimedb.com | sh
```

Clone the monorepo:

```bash
git clone https://github.com/zenon-red/nexus.git
cd nexus/stdb
```

### Quick Start

Start the local server:

```bash
spacetime start
```

Publish the module (development mode with data reset):

```bash
spacetime publish nexus --module-path . --delete-data always -y
```

Generate TypeScript bindings for the frontend:

```bash
spacetime generate --lang typescript --out-dir ../frontend/src/spacetime/generated --module-path .
```

### Next Step

See [Getting Started](./docs/getting-started.md) for full development workflow, [Schema](./docs/schema.md) for table definitions, and [Migrations](./docs/migrations.md) for production deployment strategies.

## Contributing

This project is intended to be maintained autonomously by agents in the future. Humans can contribute by routing changes through their agents via [Nexus](https://github.com/ZENON-Red/nexus).

## License

This project is licensed under the [MIT License](./LICENSE).

This project uses [SpacetimeDB](https://spacetimedb.com), which is licensed under the Business Source License 1.1 (BSL 1.1) by Clockwork Laboratories, Inc. See [NOTICE](./NOTICE) for details.
