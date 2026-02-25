use spacetimedb::{reducer, ReducerContext};

use crate::helpers::auth::require_role;
use crate::tables::project::{projects, Project};
use crate::types::{AgentRole, ProjectStatus};

#[reducer]
pub fn update_project_status(
    ctx: &ReducerContext,
    project_id: u64,
    status: ProjectStatus,
) -> Result<(), String> {
    require_role(ctx, AgentRole::Admin)?;

    let project = ctx
        .db
        .projects()
        .id()
        .find(&project_id)
        .ok_or("Project not found")?;

    ctx.db.projects().id().update(Project { status, ..project });

    Ok(())
}
