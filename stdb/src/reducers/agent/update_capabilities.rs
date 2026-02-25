use spacetimedb::{reducer, ReducerContext};

use crate::tables::agent::{agents, Agent};

#[reducer]
pub fn update_agent_capabilities(
    ctx: &ReducerContext,
    capabilities: Vec<String>,
) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(&ctx.sender())
        .ok_or("Agent not found")?;

    let normalized: Vec<String> = capabilities
        .into_iter()
        .map(|c| c.trim().to_lowercase())
        .filter(|c| !c.is_empty())
        .collect();

    ctx.db.agents().id().update(Agent {
        capabilities: normalized,
        last_active_at: ctx.timestamp,
        ..agent
    });

    Ok(())
}
