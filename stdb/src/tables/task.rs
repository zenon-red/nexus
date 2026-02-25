use spacetimedb::{table, Identity, Timestamp};

use crate::types::TaskStatus;

#[table(
    accessor = tasks,
    public,
    index(accessor = by_status, btree(columns = [status])),
    index(accessor = by_priority, btree(columns = [priority])),
    index(accessor = by_project_id, btree(columns = [project_id])),
    index(accessor = by_assigned_to, btree(columns = [assigned_to]))
)]
pub struct Task {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub project_id: u64,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub assigned_to: Option<String>,
    pub claimed_at: Option<Timestamp>,
    pub github_issue_url: Option<String>,
    pub github_pr_url: Option<String>,
    pub priority: u8,
    pub source_idea_id: Option<u64>,
    pub review_count: u8,
    pub blocked_from_status: Option<TaskStatus>,
    pub archived_reason: Option<String>,
    pub status_changed_by: Option<Identity>,
    pub status_changed_at: Option<Timestamp>,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
    pub created_by: String,
}
