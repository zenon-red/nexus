use spacetimedb::{reducer, ReducerContext, Table};

use crate::helpers::auth::require_role;
use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::agents;
use crate::tables::idea::ideas;
use crate::tables::project::{projects, Project};
use crate::tables::project_channel::{project_channels, ProjectChannel};
use crate::types::{AgentRole, IdeaStatus, ProjectStatus};

#[reducer]
pub fn create_project(
    ctx: &ReducerContext,
    source_idea_id: u64,
    name: String,
    github_repo: String,
    description: String,
) -> Result<(), String> {
    require_role(ctx, AgentRole::Admin)?;

    let sender = ctx
        .db
        .agents()
        .identity()
        .find(&ctx.sender())
        .ok_or("Agent not found")?;

    let idea = ctx
        .db
        .ideas()
        .id()
        .find(&source_idea_id)
        .ok_or("Idea not found")?;

    if idea.status != IdeaStatus::ApprovedForProject {
        return Err("Idea is not approved for project".to_string());
    }

    if ctx
        .db
        .projects()
        .by_source_idea_id()
        .filter(&source_idea_id)
        .next()
        .is_some()
    {
        return Err("Project already exists for this idea".to_string());
    }

    let inserted_project = ctx.db.projects().insert(Project {
        id: 0,
        source_idea_id,
        name: name.clone(),
        github_repo,
        description,
        status: ProjectStatus::Active,
        created_at: ctx.timestamp,
        created_by: sender.id.clone(),
    });

    ctx.db.project_channels().insert(ProjectChannel {
        project_id: inserted_project.id,
        created_at: ctx.timestamp,
    });

    send_system_message(
        ctx,
        format!("Project '{}' created from idea {}", name, source_idea_id),
        None,
    )?;

    Ok(())
}
