use spacetimedb::{table, Timestamp};

#[table(accessor = project_channels, public)]
pub struct ProjectChannel {
    #[primary_key]
    pub project_id: u64,
    pub created_at: Timestamp,
}
