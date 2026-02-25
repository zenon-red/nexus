use spacetimedb::{ReducerContext, reducer};

use crate::tables::agent::{Agent, agents};
use crate::tables::project::projects;
use crate::tables::task::{Task, tasks};
use crate::tables::task_dependency::task_dependencies;
use crate::types::{AgentStatus, DependencyType, ProjectStatus, TaskStatus};

fn has_open_blockers(ctx: &ReducerContext, task_id: u64) -> bool {
    for dep in ctx.db.task_dependencies().by_task_id().filter(&task_id) {
        if matches!(
            dep.dependency_type,
            DependencyType::Blocks | DependencyType::ParentChild
        ) {
            if let Some(blocker) = ctx.db.tasks().id().find(dep.depends_on_id) {
                if blocker.status != TaskStatus::Completed {
                    return true;
                }
            }
        }
    }
    false
}

#[reducer]
pub fn claim_task(ctx: &ReducerContext, task_id: u64) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let task = ctx.db.tasks().id().find(task_id).ok_or("Task not found")?;
    let project = ctx
        .db
        .projects()
        .id()
        .find(task.project_id)
        .ok_or("Project not found")?;

    if task.status != TaskStatus::Open {
        return Err("Task not available".to_string());
    }

    if project.status != ProjectStatus::Active {
        return Err("Project is not active".to_string());
    }

    if has_open_blockers(ctx, task_id) {
        return Err("Task has uncompleted dependencies".to_string());
    }

    let agent_id = agent.id.clone();

    ctx.db.tasks().id().update(Task {
        status: TaskStatus::Claimed,
        assigned_to: Some(agent_id.clone()),
        claimed_at: Some(ctx.timestamp),
        blocked_from_status: None,
        archived_reason: None,
        status_changed_by: Some(ctx.sender()),
        status_changed_at: Some(ctx.timestamp),
        updated_at: ctx.timestamp,
        ..task
    });

    ctx.db.agents().id().update(Agent {
        status: AgentStatus::Online,
        current_task_id: None,
        last_active_at: ctx.timestamp,
        ..agent
    });

    log::info!("Task {} claimed by {}", task_id, agent_id);
    Ok(())
}
