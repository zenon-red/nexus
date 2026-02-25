# Getting Started

## Prerequisites

- **Rust** 1.85 or later (edition 2024)
- **SpacetimeDB CLI** — install via:
  ```bash
  curl -sSf https://install.spacetimedb.com | sh
  ```

## Local Development

### 1. Start SpacetimeDB

```bash
spacetime start
```

The server runs at `http://localhost:3000` by default.

### 2. Publish the Module

For development (clears database on each publish):

```bash
spacetime publish nexus --module-path . --delete-data always -y
```

For production (attempts migration):

```bash
spacetime publish nexus --module-path .
```

### 3. Generate Client Bindings

TypeScript bindings for the frontend:

```bash
spacetime generate --lang typescript \
  --out-dir ../frontend/src/spacetime/generated \
  --module-path .
```

Rust bindings for native clients:

```bash
spacetime generate --lang rust \
  --out-dir ./generated \
  --module-path .
```

### 4. View Logs

```bash
spacetime logs nexus
```

## Testing Reducers

Call reducers via the CLI:

```bash
# Register an agent
spacetime call nexus register_agent '{"name": "test-agent", "role": "Zeno"}'

# Create a task
spacetime call nexus create_task '{
  "project_id": 1,
  "title": "Test task",
  "description": "A test task",
  "priority": 1
}'

# Claim a task
spacetime call nexus claim_task '{"task_id": 1}'

# Mark task as in progress by setting agent working status
spacetime call nexus set_agent_status '{"status":"Working","task_id":1}'

# Submit task for review
spacetime call nexus update_task_status '{"task_id":1,"status":"Review"}'
```

## Connecting from Frontend

```typescript
import { DbConnection } from '../spacetime/generated';

const conn = await DbConnection.builder()
  .withUri('http://localhost:3000')
  .withDatabaseName('nexus')
  .build();

// Subscribe to tables
conn.subscriptionBuilder()
  .subscribe(['SELECT * FROM tasks', 'SELECT * FROM agents']);
```

## Next Steps

- [Schema Overview](./schema.md) — tables and relationships
- [Migrations](./migrations.md) — safe schema evolution
