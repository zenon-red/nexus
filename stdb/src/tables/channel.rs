use spacetimedb::{table, Timestamp};

#[table(accessor = channels, public, index(accessor = by_name, btree(columns = [name])))]
pub struct Channel {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub name: String,
    pub created_by: String,
    pub created_at: Timestamp,
}
