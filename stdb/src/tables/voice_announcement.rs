use spacetimedb::{Identity, Timestamp, table};

use crate::types::AnnouncementStatus;

#[table(
    accessor = voice_announcements,
    public,
    index(accessor = by_status, btree(columns = [status, created_at])),
    index(accessor = by_agent, btree(columns = [agent_id, created_at]))
)]
pub struct VoiceAnnouncement {
    #[primary_key]
    #[auto_inc]
    pub id: u64,

    /// STDB identity of the agent who generated this voice
    pub agent_id: Identity,

    /// Per-agent monotonic sequence for guessable keys
    pub seq: u64,

    /// Human-readable agent name (e.g. "zoe")
    pub agent_name: String,

    /// Text that was spoken (for accessibility/debugging)
    pub transcript: String,

    /// Public URL to audio file (R2 or BYO)
    pub audio_url: String,

    /// Current status in lifecycle
    pub status: AnnouncementStatus,

    /// Optional context for grouping/filtering
    pub context_type: Option<String>,

    /// Optional link to related entity
    pub context_id: Option<u64>,

    /// When the announcement was marked Ready (for latency tracking)
    pub finalized_at: Option<Timestamp>,

    /// When the announcement was marked Failed (for rate tracking)
    pub failed_at: Option<Timestamp>,

    /// Persisted failure reason
    pub error_message: Option<String>,

    pub created_at: Timestamp,
}
