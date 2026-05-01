use spacetimedb::{ReducerContext, reducer};

use crate::tables::agent::{Agent, agents};

const MAX_BIO_LEN: usize = 500;

#[reducer]
pub fn update_agent_bio(ctx: &ReducerContext, bio: String) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let trimmed = bio.trim().to_string();

    if trimmed.chars().count() > MAX_BIO_LEN {
        return Err(format!("Bio exceeds {} characters", MAX_BIO_LEN));
    }

    // Reject control characters except normal whitespace
    if trimmed.chars().any(|c| c.is_control() && !c.is_whitespace()) {
        return Err("Bio contains invalid characters".to_string());
    }

    // Collapse repeated whitespace
    let normalized: String = trimmed
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    ctx.db.agents().id().update(Agent {
        bio: normalized,
        last_active_at: ctx.timestamp,
        ..agent
    });

    Ok(())
}
