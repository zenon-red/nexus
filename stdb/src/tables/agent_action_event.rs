use spacetimedb::{Timestamp, table};

use crate::types::ActionEventType;

#[table(
    accessor = agent_action_events,
    public,
    event,
    index(accessor = by_action, btree(columns = [action_id, created_at]))
)]
pub struct AgentActionEvent {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub action_id: u64,
    pub agent_id: String,
    pub event_type: ActionEventType,
    pub event_code: Option<String>,
    pub note: Option<String>,
    pub created_at: Timestamp,
}
