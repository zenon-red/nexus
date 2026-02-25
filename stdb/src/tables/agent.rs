use spacetimedb::{Identity, Timestamp, table};

use crate::types::{AgentRole, AgentStatus};

#[table(accessor = agents, public)]
pub struct Agent {
    #[primary_key]
    pub id: String,
    pub name: String,
    pub role: AgentRole,
    pub capabilities: Vec<String>,
    pub status: AgentStatus,
    pub zenon_address: String,
    #[unique]
    pub identity: Identity,
    pub last_heartbeat: Timestamp,
    pub current_task_id: Option<u64>,
    pub created_at: Timestamp,
    pub last_active_at: Timestamp,
}
