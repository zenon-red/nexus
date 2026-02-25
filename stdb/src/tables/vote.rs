use spacetimedb::{table, Timestamp};

use crate::types::VoteType;

#[table(accessor = votes, public, index(accessor = by_idea_agent, btree(columns = [idea_id, agent_id])))]
pub struct Vote {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub idea_id: u64,
    pub agent_id: String,
    pub vote_type: VoteType,
    pub created_at: Timestamp,
}
