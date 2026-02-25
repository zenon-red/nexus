use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::auth::require_role;
use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::agents;
use crate::tables::project::projects;
use crate::tables::task::{Task, tasks};
use crate::types::{AgentRole, TaskStatus};

#[reducer]
pub fn create_task(
    ctx: &ReducerContext,
    project_id: u64,
    title: String,
    description: String,
    priority: u8,
    source_idea_id: Option<u64>,
    github_issue_url: Option<String>,
) -> Result<(), String> {
    require_role(ctx, AgentRole::Admin)?;

    let sender = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    if ctx.db.projects().id().find(project_id).is_none() {
        return Err("Project not found".to_string());
    }

    let inserted = ctx.db.tasks().insert(Task {
        id: 0,
        project_id,
        title: title.clone(),
        description,
        status: TaskStatus::Open,
        assigned_to: None,
        claimed_at: None,
        github_issue_url,
        github_pr_url: None,
        priority,
        source_idea_id,
        review_count: 0,
        blocked_from_status: None,
        archived_reason: None,
        status_changed_by: None,
        status_changed_at: None,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
        created_by: sender.id,
    });

    send_system_message(
        ctx,
        format!("New task created: {}", inserted.id),
        Some("general"),
    )?;
    Ok(())
}
