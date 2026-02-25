use std::collections::HashSet;

use spacetimedb::{reducer, ReducerContext, Table};

use crate::tables::task::tasks;
use crate::tables::task_dependency::{task_dependencies, TaskDependency};
use crate::types::DependencyType;

fn would_create_cycle(ctx: &ReducerContext, from: u64, to: u64) -> bool {
    let mut visited = HashSet::new();
    let mut queue = vec![to];

    while let Some(current) = queue.pop() {
        if current == from {
            return true;
        }

        if visited.insert(current) {
            for dep in ctx.db.task_dependencies().by_task_id().filter(&current) {
                if matches!(
                    dep.dependency_type,
                    DependencyType::Blocks | DependencyType::ParentChild
                ) {
                    queue.push(dep.depends_on_id);
                }
            }
        }
    }

    false
}

#[reducer]
pub fn add_task_dependency(
    ctx: &ReducerContext,
    task_id: u64,
    depends_on_id: u64,
    dependency_type: DependencyType,
) -> Result<(), String> {
    if task_id == depends_on_id {
        return Err("Task cannot depend on itself".to_string());
    }

    if ctx.db.tasks().id().find(&task_id).is_none() {
        return Err("Task not found".to_string());
    }
    if ctx.db.tasks().id().find(&depends_on_id).is_none() {
        return Err("Dependency task not found".to_string());
    }

    if would_create_cycle(ctx, task_id, depends_on_id) {
        return Err("Would create circular dependency".to_string());
    }

    let already_exists = ctx
        .db
        .task_dependencies()
        .by_task_id()
        .filter(&task_id)
        .any(|dep| dep.depends_on_id == depends_on_id && dep.dependency_type == dependency_type);

    if already_exists {
        return Err("Dependency already exists".to_string());
    }

    ctx.db.task_dependencies().insert(TaskDependency {
        id: 0,
        task_id,
        depends_on_id,
        dependency_type,
        created_at: ctx.timestamp,
    });

    Ok(())
}
