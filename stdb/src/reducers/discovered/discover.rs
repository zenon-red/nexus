use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::activity::update_agent_activity;
use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::agents;
use crate::tables::discovered_task::{DiscoveredTask, discovered_tasks};
use crate::tables::project::projects;
use crate::types::DiscoveredTaskStatus;

#[reducer]
#[allow(clippy::too_many_arguments)]
pub fn discover_task(
    ctx: &ReducerContext,
    current_task_id: u64,
    project_id: u64,
    title: String,
    description: String,
    priority: u8,
    task_type: String,
    severity: String,
) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    if ctx.db.projects().id().find(project_id).is_none() {
        return Err("Project not found".to_string());
    }

    let inserted = ctx.db.discovered_tasks().insert(DiscoveredTask {
        id: 0,
        discovered_by: agent.id.clone(),
        current_task_id,
        project_id,
        title: title.clone(),
        description,
        priority,
        task_type,
        severity,
        status: DiscoveredTaskStatus::PendingReview,
        created_task_id: None,
        rejection_reason: None,
        created_at: ctx.timestamp,
        reviewed_at: None,
        reviewed_by: None,
    });

    update_agent_activity(ctx, agent)?;
    send_system_message(ctx, format!("New discovery: {}", inserted.id), None)?;
    Ok(())
}
