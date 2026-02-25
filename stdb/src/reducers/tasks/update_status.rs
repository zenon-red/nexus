use spacetimedb::{ReducerContext, reducer};

use crate::tables::agent::{Agent, agents};
use crate::tables::task::{Task, tasks};
use crate::types::{AgentRole, AgentStatus, TaskStatus};

fn is_admin_or_zoe(role: &AgentRole) -> bool {
    matches!(role, AgentRole::Admin | AgentRole::Zoe)
}

fn is_valid_task_transition(
    current: &TaskStatus,
    next: &TaskStatus,
    blocked_from: Option<&TaskStatus>,
) -> bool {
    if current == next {
        return true;
    }

    match current {
        TaskStatus::Open => false,
        TaskStatus::Claimed => matches!(next, TaskStatus::InProgress | TaskStatus::Blocked),
        TaskStatus::InProgress => matches!(next, TaskStatus::Review | TaskStatus::Blocked),
        TaskStatus::Review => matches!(next, TaskStatus::Completed | TaskStatus::Blocked),
        TaskStatus::Blocked => blocked_from.is_some_and(|status| status == next),
        TaskStatus::Completed => false,
        TaskStatus::Archived => false,
    }
}

#[reducer]
pub fn update_task_status(
    ctx: &ReducerContext,
    task_id: u64,
    status: TaskStatus,
    github_pr_url: Option<String>,
    archive_reason: Option<String>,
) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let task = ctx.db.tasks().id().find(task_id).ok_or("Task not found")?;
    let privileged = is_admin_or_zoe(&agent.role);

    if task.assigned_to != Some(agent.id.clone()) && !privileged {
        return Err("Not assigned to this task".to_string());
    }

    if status == TaskStatus::Archived && !privileged {
        return Err("Only admin/zoe can archive tasks".to_string());
    }

    if status != TaskStatus::Archived && archive_reason.is_some() {
        return Err("archive_reason can only be provided when archiving".to_string());
    }

    if task.status == TaskStatus::Archived && status != TaskStatus::Archived {
        return Err("Archived tasks are immutable".to_string());
    }

    if task.status == TaskStatus::Review && status == TaskStatus::Completed && !privileged {
        return Err("Only admin/zoe can move task from review to completed".to_string());
    }

    if task.status == TaskStatus::Open && status != TaskStatus::Archived {
        return Err("Use claim_task to transition open tasks".to_string());
    }

    if status != TaskStatus::Archived
        && !is_valid_task_transition(&task.status, &status, task.blocked_from_status.as_ref())
    {
        return Err(format!(
            "Invalid transition: {} -> {}",
            task.status.as_str(),
            status.as_str()
        ));
    }

    let mut blocked_from_status = task.blocked_from_status.clone();
    let mut archived_reason_value = task.archived_reason.clone();
    let status_changed = task.status != status;
    let status_changed_by = if status_changed {
        Some(ctx.sender())
    } else {
        task.status_changed_by
    };
    let status_changed_at = if status_changed {
        Some(ctx.timestamp)
    } else {
        task.status_changed_at
    };

    if status == TaskStatus::Blocked && task.status != TaskStatus::Blocked {
        blocked_from_status = Some(task.status.clone());
        archived_reason_value = None;
    } else if task.status == TaskStatus::Blocked && status != TaskStatus::Blocked {
        blocked_from_status = None;
        archived_reason_value = None;
    } else if status == TaskStatus::Archived {
        blocked_from_status = None;
        archived_reason_value = archive_reason;
    } else if status != TaskStatus::Blocked {
        blocked_from_status = None;
        archived_reason_value = None;
    }

    ctx.db.tasks().id().update(Task {
        status: status.clone(),
        github_pr_url: github_pr_url.or(task.github_pr_url),
        blocked_from_status,
        archived_reason: archived_reason_value,
        status_changed_by,
        status_changed_at,
        updated_at: ctx.timestamp,
        ..task
    });

    if let Some(assignee_id) = ctx
        .db
        .tasks()
        .id()
        .find(task_id)
        .and_then(|t| t.assigned_to)
    {
        if let Some(assignee) = ctx.db.agents().id().find(&assignee_id) {
            if status == TaskStatus::InProgress {
                ctx.db.agents().id().update(Agent {
                    status: AgentStatus::Working,
                    current_task_id: Some(task_id),
                    last_active_at: ctx.timestamp,
                    ..assignee
                });
            } else if assignee.current_task_id == Some(task_id) {
                ctx.db.agents().id().update(Agent {
                    status: AgentStatus::Online,
                    current_task_id: None,
                    last_active_at: ctx.timestamp,
                    ..assignee
                });
            }
        }
    }

    if let Some(current_agent) = ctx.db.agents().id().find(&agent.id) {
        ctx.db.agents().id().update(Agent {
            last_active_at: ctx.timestamp,
            ..current_agent
        });
    }

    Ok(())
}
