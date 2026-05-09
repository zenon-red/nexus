use spacetimedb::{ReducerContext, Table, reducer};

use crate::tables::agent::agents;
use crate::tables::agent_action::{AgentAction, agent_actions};
use crate::tables::agent_action_event::{AgentActionEvent, agent_action_events};
use crate::types::{ActionEventType, ActionStatus};

#[reducer]
pub fn update_agent_action(
    ctx: &ReducerContext,
    action_id: u64,
    event_type: ActionEventType,
    event_code: Option<String>,
    note: Option<String>,
) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let action = ctx
        .db
        .agent_actions()
        .id()
        .find(&action_id)
        .ok_or("Action not found")?;

    if action.agent_id != agent.id {
        return Err("Unauthorized: can only update own actions".to_string());
    }

    if action.status != ActionStatus::Issued {
        return Err("Action is not in Issued status".to_string());
    }

    let new_status = match event_type {
        ActionEventType::Completed => ActionStatus::Completed,
        ActionEventType::Skipped => ActionStatus::Skipped,
        ActionEventType::Failed => ActionStatus::Failed,
        ActionEventType::Expired => ActionStatus::Expired,
        ActionEventType::Issued => return Err("Cannot transition to Issued via update".to_string()),
    };

    ctx.db.agent_actions().id().update(AgentAction {
        status: new_status,
        updated_at: ctx.timestamp,
        ..action
    });

    ctx.db.agent_action_events().insert(AgentActionEvent {
        id: 0,
        action_id,
        agent_id: agent.id,
        event_type,
        event_code,
        note,
        created_at: ctx.timestamp,
    });

    Ok(())
}
