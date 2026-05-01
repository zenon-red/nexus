use spacetimedb::{Identity, table};

/// Private table for per-agent voice announcement sequence counters.
#[table(accessor = agent_voice_counters)]
pub struct AgentVoiceCounter {
    #[primary_key]
    pub agent_id: Identity,
    pub next_seq: u64,
}
