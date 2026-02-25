use spacetimedb::{table, Timestamp};

use crate::types::MessageType;

#[table(accessor = project_messages, public, index(accessor = by_project, btree(columns = [project_id])))]
pub struct ProjectMessage {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub project_id: u64,
    pub sender_id: String,
    pub content: String,
    pub message_type: MessageType,
    pub context_id: Option<String>,
    pub created_at: Timestamp,
}
