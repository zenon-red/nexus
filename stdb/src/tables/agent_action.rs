use spacetimedb::{Timestamp, table};

use crate::types::{ActionKind, ActionStatus};

#[table(
    accessor = agent_actions,
    public,
    index(accessor = by_agent_id, btree(columns = [agent_id])),
    index(accessor = by_agent_created, btree(columns = [agent_id, created_at]))
)]
pub struct AgentAction {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub agent_id: String,
    pub kind: ActionKind,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub reason_code: String,
    pub status: ActionStatus,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}
