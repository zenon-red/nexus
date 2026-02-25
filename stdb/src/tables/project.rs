use spacetimedb::{Timestamp, table};

use crate::types::ProjectStatus;

#[table(accessor = projects, public, index(accessor = by_source_idea_id, btree(columns = [source_idea_id])))]
pub struct Project {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub source_idea_id: u64,
    pub name: String,
    pub github_repo: String,
    pub description: String,
    pub status: ProjectStatus,
    pub created_at: Timestamp,
    pub created_by: String,
}
