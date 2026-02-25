use spacetimedb::{table, Timestamp};

use crate::types::DiscoveredTaskStatus;

#[table(
    accessor = discovered_tasks,
    public,
    index(accessor = by_status, btree(columns = [status])),
    index(accessor = by_priority, btree(columns = [priority])),
    index(accessor = by_created_at, btree(columns = [created_at]))
)]
pub struct DiscoveredTask {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub discovered_by: String,
    pub current_task_id: u64,
    pub project_id: u64,
    pub title: String,
    pub description: String,
    pub priority: u8,
    pub task_type: String,
    pub severity: String,
    pub status: DiscoveredTaskStatus,
    pub created_task_id: Option<u64>,
    pub rejection_reason: Option<String>,
    pub created_at: Timestamp,
    pub reviewed_at: Option<Timestamp>,
    pub reviewed_by: Option<String>,
}
