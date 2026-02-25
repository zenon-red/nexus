use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::activity::update_agent_activity;
use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::agents;
use crate::tables::idea::{Idea, ideas};
use crate::tables::vote::{Vote, votes};
use crate::types::{IdeaStatus, VoteType};

#[reducer]
pub fn vote_idea(ctx: &ReducerContext, idea_id: u64, vote_type: VoteType) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let idea = ctx.db.ideas().id().find(idea_id).ok_or("Idea not found")?;

    if idea.status != IdeaStatus::Voting {
        return Err("Voting closed".to_string());
    }

    let existing = ctx
        .db
        .votes()
        .by_idea_agent()
        .filter(&idea_id)
        .any(|v| v.agent_id == agent.id);

    if existing {
        return Err("Already voted".to_string());
    }

    ctx.db.votes().insert(Vote {
        id: 0,
        idea_id,
        agent_id: agent.id.clone(),
        vote_type: vote_type.clone(),
        created_at: ctx.timestamp,
    });

    let (up_votes, down_votes, veto_count) = match vote_type {
        VoteType::Up => (idea.up_votes + 1, idea.down_votes, idea.veto_count),
        VoteType::Down => (idea.up_votes, idea.down_votes + 1, idea.veto_count),
        VoteType::Veto => (idea.up_votes, idea.down_votes, idea.veto_count + 1),
    };
    let total_votes = idea.total_votes + 1;

    if veto_count >= idea.veto_threshold {
        ctx.db.ideas().id().update(Idea {
            status: IdeaStatus::Rejected,
            up_votes,
            down_votes,
            veto_count,
            total_votes,
            updated_at: ctx.timestamp,
            ..idea
        });
        update_agent_activity(ctx, agent)?;
        send_system_message(ctx, format!("Idea {} rejected by veto", idea_id), None)?;
        return Ok(());
    }

    if total_votes < idea.quorum {
        ctx.db.ideas().id().update(Idea {
            up_votes,
            down_votes,
            veto_count,
            total_votes,
            updated_at: ctx.timestamp,
            ..idea
        });
        update_agent_activity(ctx, agent)?;
        return Ok(());
    }

    if up_votes >= idea.approval_threshold {
        let idea_title = idea.title.clone();

        ctx.db.ideas().id().update(Idea {
            status: IdeaStatus::ApprovedForProject,
            up_votes,
            down_votes,
            veto_count,
            total_votes,
            updated_at: ctx.timestamp,
            ..idea
        });
        update_agent_activity(ctx, agent)?;

        send_system_message(
            ctx,
            format!("Idea '{}' approved", idea_title),
            Some("general"),
        )?;
        send_system_message(
            ctx,
            format!(
                "Idea '{}' approved for project creation. Review and create project when ready.",
                idea_title
            ),
            Some("zoe"),
        )?;
        return Ok(());
    }

    ctx.db.ideas().id().update(Idea {
        up_votes,
        down_votes,
        veto_count,
        total_votes,
        updated_at: ctx.timestamp,
        ..idea
    });

    update_agent_activity(ctx, agent)?;
    Ok(())
}
