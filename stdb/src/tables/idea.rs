use spacetimedb::{Timestamp, table};

use crate::types::IdeaStatus;

#[table(accessor = ideas, public, index(accessor = by_status, btree(columns = [status])))]
pub struct Idea {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub status: IdeaStatus,
    pub active_agent_count: u32,
    pub quorum: u16,
    pub approval_threshold: u16,
    pub veto_threshold: u16,
    pub up_votes: u16,
    pub down_votes: u16,
    pub veto_count: u16,
    pub total_votes: u16,
    pub created_by: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}
