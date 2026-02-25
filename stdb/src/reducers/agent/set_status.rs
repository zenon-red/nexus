use spacetimedb::{ReducerContext, reducer};

use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::{Agent, agents};
use crate::tables::task::tasks;
use crate::types::{AgentStatus, TaskStatus};

#[reducer]
pub fn set_agent_status(
    ctx: &ReducerContext,
    status: AgentStatus,
    task_id: Option<u64>,
) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let new_status = status;
    let mut next_task_id = None;
    let old_status = agent.status.clone();

    if new_status == AgentStatus::Working {
        let required_task_id = task_id.ok_or("task_id is required when status is working")?;
        let task = ctx
            .db
            .tasks()
            .id()
            .find(required_task_id)
            .ok_or("Task not found")?;

        if task.assigned_to != Some(agent.id.clone()) {
            return Err("Task is not assigned to this agent".to_string());
        }

        if task.status == TaskStatus::Claimed {
            ctx.db.tasks().id().update(crate::tables::task::Task {
                status: TaskStatus::InProgress,
                status_changed_by: Some(ctx.sender()),
                status_changed_at: Some(ctx.timestamp),
                updated_at: ctx.timestamp,
                ..task
            });
        } else if task.status != TaskStatus::InProgress {
            return Err("Task must be claimed or in_progress to mark working".to_string());
        }

        next_task_id = Some(required_task_id);

        if old_status != AgentStatus::Working || agent.current_task_id != Some(required_task_id) {
            send_system_message(
                ctx,
                format!("{} is now working on task {}", agent.name, required_task_id),
                None,
            )?;
        }
    }

    if new_status != AgentStatus::Working && task_id.is_some() {
        return Err("task_id can only be provided when status is working".to_string());
    }

    ctx.db.agents().id().update(Agent {
        status: new_status,
        current_task_id: next_task_id,
        last_heartbeat: ctx.timestamp,
        ..agent
    });

    Ok(())
}
