use spacetimedb::{ReducerContext, Table, reducer};

use crate::tables::agent::agents;
use crate::tables::agent_action::{AgentAction, agent_actions};
use crate::tables::agent_action_event::{AgentActionEvent, agent_action_events};
use crate::types::{ActionEventType, ActionStatus};

#[reducer]
pub fn issue_agent_action(
    ctx: &ReducerContext,
    agent_id: String,
    kind: crate::types::ActionKind,
    target_type: Option<String>,
    target_id: Option<String>,
    reason_code: String,
) -> Result<(), String> {
    if agent_id.is_empty() {
        return Err("Agent ID cannot be empty".to_string());
    }
    if reason_code.trim().is_empty() {
        return Err("Reason code cannot be empty".to_string());
    }

    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;
    if agent.id != agent_id {
        return Err("Unauthorized: can only issue actions for own agent".to_string());
    }

    // Expire any existing Issued actions for this agent
    let active_actions: Vec<AgentAction> = ctx
        .db
        .agent_actions()
        .by_agent_id()
        .filter(&agent_id)
        .filter(|a| a.status == ActionStatus::Issued)
        .collect();

    for old in active_actions {
        ctx.db.agent_actions().id().update(AgentAction {
            status: ActionStatus::Expired,
            updated_at: ctx.timestamp,
            ..old
        });
        ctx.db.agent_action_events().insert(AgentActionEvent {
            id: 0,
            action_id: old.id,
            agent_id: agent_id.clone(),
            event_type: ActionEventType::Expired,
            event_code: Some("SUPERSEDED".to_string()),
            note: Some("Replaced by newer action".to_string()),
            created_at: ctx.timestamp,
        });
    }

    // Insert new action
    let action = ctx.db.agent_actions().insert(AgentAction {
        id: 0,
        agent_id: agent_id.clone(),
        kind,
        target_type,
        target_id,
        reason_code,
        status: ActionStatus::Issued,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    // Append Issued event
    ctx.db.agent_action_events().insert(AgentActionEvent {
        id: 0,
        action_id: action.id,
        agent_id,
        event_type: ActionEventType::Issued,
        event_code: None,
        note: None,
        created_at: ctx.timestamp,
    });

    Ok(())
}
