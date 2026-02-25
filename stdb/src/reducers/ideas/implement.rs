use spacetimedb::{ReducerContext, reducer};

use crate::helpers::auth::require_role;
use crate::tables::idea::{Idea, ideas};
use crate::types::{AgentRole, IdeaStatus};

#[reducer]
pub fn mark_idea_implemented(ctx: &ReducerContext, idea_id: u64) -> Result<(), String> {
    require_role(ctx, AgentRole::Zoe)?;

    let idea = ctx.db.ideas().id().find(idea_id).ok_or("Idea not found")?;

    if idea.status != IdeaStatus::ApprovedForProject {
        return Err("Idea must be approved for project before marking as implemented".to_string());
    }

    ctx.db.ideas().id().update(Idea {
        status: IdeaStatus::Implemented,
        updated_at: ctx.timestamp,
        ..idea
    });

    Ok(())
}
