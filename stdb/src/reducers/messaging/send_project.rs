use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::activity::update_agent_activity;
use crate::helpers::auth::require_role;
use crate::tables::agent::agents;
use crate::tables::project::projects;
use crate::tables::project_channel::project_channels;
use crate::tables::project_message::{ProjectMessage, project_messages};
use crate::types::{AgentRole, MessageType};

#[reducer]
pub fn send_project_message(
    ctx: &ReducerContext,
    project_id: u64,
    content: String,
    message_type: MessageType,
    context_id: Option<String>,
) -> Result<(), String> {
    if content.is_empty() {
        return Err("Message cannot be empty".to_string());
    }

    if matches!(message_type, MessageType::System) {
        require_role(ctx, AgentRole::Admin)?;
    }

    if matches!(message_type, MessageType::Directive) {
        require_role(ctx, AgentRole::Zoe)?;
    }

    if ctx.db.projects().id().find(project_id).is_none() {
        return Err("Project not found".to_string());
    }

    if ctx
        .db
        .project_channels()
        .project_id()
        .find(project_id)
        .is_none()
    {
        return Err("Project channel not found".to_string());
    }

    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not registered")?;

    ctx.db.project_messages().insert(ProjectMessage {
        id: 0,
        project_id,
        sender_id: agent.id.clone(),
        content,
        message_type,
        context_id,
        created_at: ctx.timestamp,
    });

    update_agent_activity(ctx, agent)?;
    Ok(())
}
