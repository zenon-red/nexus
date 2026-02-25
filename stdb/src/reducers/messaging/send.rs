use spacetimedb::{reducer, ReducerContext, Table};

use crate::helpers::activity::update_agent_activity;
use crate::helpers::auth::require_role;
use crate::tables::agent::agents;
use crate::tables::channel::channels;
use crate::tables::message::{messages, Message};
use crate::types::{AgentRole, MessageType};

#[reducer]
pub fn send_message(
    ctx: &ReducerContext,
    channel_id: u64,
    content: String,
    message_type: MessageType,
    context_id: Option<String>,
) -> Result<(), String> {
    if content.is_empty() {
        return Err("Message cannot be empty".to_string());
    }

    if ctx.db.channels().id().find(&channel_id).is_none() {
        return Err("Channel not found".to_string());
    }

    if matches!(message_type, MessageType::System) {
        require_role(ctx, AgentRole::Admin)?;
    }

    if matches!(message_type, MessageType::Directive) {
        require_role(ctx, AgentRole::Zoe)?;
    }

    let agent = ctx
        .db
        .agents()
        .identity()
        .find(&ctx.sender())
        .ok_or("Agent not registered")?;

    ctx.db.messages().insert(Message {
        id: 0,
        channel_id,
        sender_id: agent.id.clone(),
        content,
        message_type,
        context_id,
        created_at: ctx.timestamp,
    });

    update_agent_activity(ctx, agent)?;
    Ok(())
}

pub fn send_system_message(
    ctx: &ReducerContext,
    content: String,
    channel_name: Option<&str>,
) -> Result<(), String> {
    let target_channel_name = channel_name.unwrap_or("general");
    let channel_id = ctx
        .db
        .channels()
        .by_name()
        .filter(&target_channel_name.to_string())
        .next()
        .map(|c| c.id)
        .ok_or_else(|| format!("Channel not found: {}", target_channel_name))?;

    ctx.db.messages().insert(Message {
        id: 0,
        channel_id,
        sender_id: "system".to_string(),
        content,
        message_type: MessageType::System,
        context_id: None,
        created_at: ctx.timestamp,
    });

    Ok(())
}
