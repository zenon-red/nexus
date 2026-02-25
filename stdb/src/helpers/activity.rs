use spacetimedb::{ReducerContext, Table};
use std::time::Duration;

use crate::tables::agent::{agents, Agent};
use crate::tables::config::config;

pub fn get_activity_window_days(ctx: &ReducerContext) -> u64 {
    ctx.db
        .config()
        .key()
        .find(&"activity_window_days".to_string())
        .and_then(|c| c.value.parse().ok())
        .unwrap_or(7)
}

pub fn count_active_agents(ctx: &ReducerContext, window_days: u64) -> u32 {
    let window_micros = window_days * 24 * 60 * 60 * 1_000_000;
    let cutoff = ctx.timestamp - Duration::from_micros(window_micros);
    ctx.db
        .agents()
        .iter()
        .filter(|a| a.last_active_at > cutoff)
        .count() as u32
}

pub fn update_agent_activity(ctx: &ReducerContext, agent: Agent) -> Result<(), String> {
    ctx.db.agents().id().update(Agent {
        last_active_at: ctx.timestamp,
        ..agent
    });
    Ok(())
}
