---
name: nexus-stdb
description: Use when working on the Nexus SpacetimeDB Rust module in `nexus/stdb`. Covers schema changes, reducer implementations, task lifecycle enforcement, role permissions, binding regeneration, and code validation. Essential for maintaining consistency between tables, reducers, and documentation.
compatibility: Requires Rust 1.85+, SpacetimeDB CLI, cargo. Designed for use with Claude Code or similar AI coding agents.
metadata:
  author: zenon-red
  version: "1.0"
---

# Nexus STDB Module

SpacetimeDB backend module for the Nexus orchestration layer.

**⚠️ CRITICAL: Read the reference before coding**

Before making ANY changes to this module, read:
- **[SpacetimeDB Rust Rules](references/spacetimedb-rust.md)** — Language rules, common mistakes, correct patterns

## Validate Changes

Run these checks after any backend change:

```bash
cargo check
cargo fmt --all -- --check
```

If needed, run formatter and re-check:

```bash
cargo fmt --all
cargo check
```

## Source of Truth

Treat these as the single source of truth:
- `src/tables/*.rs` — Table definitions
- `src/reducers/*.rs` — Reducer implementations
- `src/types.rs` — Custom types and enums

## Task Lifecycle Rules

Enforce and preserve this lifecycle:

`Open -> Claimed -> InProgress -> Review -> Completed`

Side branches:
- `Claimed | InProgress | Review -> Blocked`
- `Blocked -> blocked_from_status`
- `* -> Archived` (admin/zoe only; terminal)

Keep these invariants:
- Use `claim_task` for `Open -> Claimed`.
- Use `set_agent_status(Working, task_id)` to move `Claimed -> InProgress`.
- Allow only `Admin/Zoe` for `Review -> Completed`.
- Clear `current_task_id` when agent is not `Working`.

## Role and Identity Rules

- Trust `ctx.sender` for identity; do not accept caller identity args.
- Use role checks via existing helpers (`require_role`, `has_role`).
- Keep reducers deterministic (no filesystem/network/random external sources).

## Current Typed Enums in Reducer APIs

Prefer enum args over raw strings for these reducers:
- `set_agent_status(status: AgentStatus, task_id: Option<u64>)`
- `review_discovered_task(..., decision: DiscoveryDecision, ...)`
- `add_task_dependency(..., dependency_type: DependencyType)`

Use `TaskStatus` in `update_task_status` with `archive_reason` only when archiving.

## Binding Regeneration

Regenerate after schema/reducer signature changes; do not edit generated bindings manually.

Frontend bindings:

```bash
spacetime generate --lang typescript --out-dir ../frontend/src/spacetime/generated --module-path .
```

Probe bindings:

```bash
spacetime generate --lang typescript --out-dir ../probe/src/module_bindings --module-path .
```

## Documentation Consistency Pass

When finishing work, verify docs match code:
- `README.md`
- `docs/schema.md`
- `docs/getting-started.md`
- `docs/migrations.md`

Check for drift in:
- table columns/index names
- reducer names and argument shapes
- lifecycle/status lists
- role restrictions

If docs and code conflict, update docs to match code.

## Common Patterns

### Adding a new table

1. Create `src/tables/new_table.rs`
2. Export in `src/tables/mod.rs`
3. Add to `src/lib.rs` module registry
4. Update `docs/schema.md`

### Adding a new reducer

1. Add to appropriate `src/reducers/{category}/` file
2. Follow existing patterns for validation and auth
3. Update `docs/schema.md` reducers list

### Testing reducers locally

```bash
# Register an agent
spacetime call nexus register_agent '{"name": "test", "role": "Zeno"}'

# Create a task
spacetime call nexus create_task '{"project_id": 1, "title": "Test", "description": "", "priority": 1}'

# Claim it
spacetime call nexus claim_task '{"task_id": 1}'
```

## SpacetimeDB Quick Reference

```bash
# Start local server
spacetime start

# Publish (dev - clears data)
spacetime publish nexus --module-path . --delete-data always -y

# Publish (production)
spacetime publish nexus --module-path .

# View logs
spacetime logs nexus --follow

# Generate bindings
spacetime generate --lang typescript --out-dir ../frontend/src/spacetime/generated --module-path .
```

See [spacetimedb-rust.md](references/spacetimedb-rust.md) for detailed language rules.
