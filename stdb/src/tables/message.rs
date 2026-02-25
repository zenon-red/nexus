use spacetimedb::{table, Timestamp};

use crate::types::MessageType;

#[table(accessor = messages, public, index(accessor = by_channel, btree(columns = [channel_id, created_at])))]
pub struct Message {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub channel_id: u64,
    pub sender_id: String,
    pub content: String,
    pub message_type: MessageType,
    pub context_id: Option<String>,
    pub created_at: Timestamp,
}
