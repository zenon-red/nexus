use spacetimedb::{reducer, ReducerContext};

use crate::tables::agent::{agents, Agent};

#[reducer]
pub fn heartbeat(ctx: &ReducerContext, agent_id: String) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .id()
        .find(&agent_id)
        .ok_or("Agent not found")?;

    if agent.identity != ctx.sender() {
        return Err("Unauthorized".to_string());
    }

    ctx.db.agents().id().update(Agent {
        last_heartbeat: ctx.timestamp,
        last_active_at: ctx.timestamp,
        ..agent
    });

    Ok(())
}
