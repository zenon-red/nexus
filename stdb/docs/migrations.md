# Schema Migrations

SpacetimeDB supports additive schema changes without data loss. Understanding what's safe vs. breaking is critical for production deployments.

## Safe Changes (No Data Loss)

These changes can be deployed without clearing the database:

| Change | Example |
|--------|---------|
| Adding new tables | `#[table(name = new_table, public)]` |
| Adding new reducers | `#[reducer] pub fn new_reducer(...)` |
| Adding new indexes | `index(name = by_field, btree(columns = [field]))` |
| Adding `#[auto_inc]` | To existing integer primary keys |
| Making tables public | Add `public` flag |
| Removing `#[unique]` | From non-unique columns |
| Adding columns with defaults | At **end** of table with default value |

### Adding a Column (Safe)

```rust
// BEFORE
#[table(name = tasks, public)]
pub struct Task {
    #[primary_key]
    pub id: u64,
    pub title: String,
}

// AFTER - Add column at end with default
#[table(name = tasks, public)]
pub struct Task {
    #[primary_key]
    pub id: u64,
    pub title: String,
    #[default(5)]
    pub priority: u8,  // Added at end with default
}
```

## Potentially Breaking Changes

These may cause issues with existing clients:

| Change | Risk |
|--------|------|
| Adding columns with default | Old clients ignore new field |
| Modifying/removing reducers | Runtime errors for old clients |
| Making tables private | Clients lose subscription access |

## Forbidden Changes (Requires Database Clear)

These changes require `--delete-data always -y`:

| Change | Reason |
|--------|--------|
| Removing tables | Data would be orphaned |
| Removing columns | Data would be lost |
| Modifying column types | Type mismatch |
| Renaming columns | Data mapping breaks |
| Reordering columns | Binary format breaks |
| Adding columns without defaults | NULL violations |
| Adding columns mid-table | Binary format breaks |
| Adding `#[unique]` constraint | Existing duplicates would fail |
| Adding `#[primary_key]` | Existing duplicates would fail |

## Deployment Strategies

### Development

Always clear database to ensure clean state:

```bash
spacetime publish nexus --module-path . --delete-data always -y
```

### Production

1. **Plan additive changes only** — never remove/modify existing columns
2. **Test locally first** — verify migrations work with test data
3. **Deploy without clearing** — let SpacetimeDB apply migrations:

```bash
spacetime publish nexus --module-path .
```

4. **Monitor logs** for errors:

```bash
spacetime logs nexus --follow
```

### Rollback Strategy

If a migration fails in production:

1. SpacetimeDB automatically rolls back failed migrations
2. The old module continues running
3. Fix the schema and republish

## Best Practices

### 1. Prefer Additive Changes

Instead of modifying a table, create a new one:

```rust
// BAD: Modifying existing table
#[table(name = tasks)]
pub struct Task {
    pub status: String,  // Changed from enum to string
}

// GOOD: New table version
#[table(name = tasks_v2, public)]
pub struct TaskV2 {
    #[primary_key]
    pub id: u64,
    pub status: TaskStatus,
}
```

### 2. Version Your Reducers

Keep old reducers for backward compatibility:

```rust
#[reducer]
pub fn create_task_v1(ctx: &ReducerContext, title: String) {
    // Legacy API
}

#[reducer]
pub fn create_task(ctx: &ReducerContext, title: String, priority: u8) {
    // New API
}
```

### 3. Use Default Values

Always provide defaults for new columns:

```rust
#[table(name = tasks, public)]
pub struct Task {
    #[primary_key]
    pub id: u64,
    pub title: String,
    #[default(false)]
    pub is_urgent: bool,
    #[default("")]
    pub labels: String,
}
```

### 4. Never Edit Generated Bindings

After schema changes, always regenerate:

```bash
spacetime generate --lang typescript --out-dir ../frontend/src/spacetime/generated --module-path .
```

## Migration Checklist

Before deploying to production:

- [ ] All changes are additive (new tables/columns/reducers)
- [ ] New columns have default values
- [ ] New columns are at end of table definition
- [ ] Tested locally with representative data
- [ ] Client bindings regenerated
- [ ] Clients updated to handle new fields
