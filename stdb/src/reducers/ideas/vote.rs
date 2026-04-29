use std::collections::HashSet;

use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::activity::update_agent_activity;
use crate::helpers::scoring::{compute_idea_score, derive_vote_type, get_approval_threshold};
use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::agents;
use crate::tables::evaluation_dimension::{EvaluationDimension, evaluation_dimensions};
use crate::tables::idea::{Idea, ideas};
use crate::tables::vote::{Vote, votes};
use crate::types::{DimensionScore, IdeaStatus, VoteType};

fn validate_scores(
    scores: &[DimensionScore],
    active_dimensions: &[EvaluationDimension],
) -> Result<(), String> {
    if scores.is_empty() {
        return Err("Scores cannot be empty; submit dimension scores to vote".to_string());
    }

    if active_dimensions.is_empty() {
        return Err("No active evaluation dimensions configured".to_string());
    }

    let mut seen = HashSet::new();
    for score in scores {
        if !seen.insert(score.dimension.as_str()) {
            return Err(format!(
                "Duplicate dimension '{}'; each dimension scored once",
                score.dimension
            ));
        }

        let dim = active_dimensions
            .iter()
            .find(|d| d.name == score.dimension)
            .ok_or_else(|| {
                format!(
                    "Dimension '{}' is not active or does not exist",
                    score.dimension
                )
            })?;

        if score.score < dim.min_score || score.score > dim.max_score {
            return Err(format!(
                "Score {} for dimension '{}' is outside range {}-{}",
                score.score, score.dimension, dim.min_score, dim.max_score
            ));
        }
    }

    let missing_dimensions: Vec<String> = active_dimensions
        .iter()
        .filter(|dimension| !seen.contains(dimension.name.as_str()))
        .map(|dimension| dimension.name.clone())
        .collect();

    if !missing_dimensions.is_empty() {
        let required = active_dimensions
            .iter()
            .map(|d| d.name.as_str())
            .collect::<Vec<_>>()
            .join(", ");
        return Err(format!(
            "Missing active dimension scores: {}. Required dimensions: {}",
            missing_dimensions.join(", "),
            required
        ));
    }

    Ok(())
}

#[reducer]
pub fn vote_idea(
    ctx: &ReducerContext,
    idea_id: u64,
    scores: Vec<DimensionScore>,
) -> Result<(), String> {
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

    let active_dims: Vec<EvaluationDimension> = ctx
        .db
        .evaluation_dimensions()
        .by_active()
        .filter(&true)
        .collect();
    validate_scores(&scores, &active_dims)?;

    let vote_type = derive_vote_type(ctx, &scores);

    ctx.db.votes().insert(Vote {
        id: 0,
        idea_id,
        agent_id: agent.id.clone(),
        vote_type: vote_type.clone(),
        scores,
        created_at: ctx.timestamp,
    });

    let (up_votes, down_votes, veto_count) = match vote_type {
        VoteType::Up => (idea.up_votes + 1, idea.down_votes, idea.veto_count),
        VoteType::Down => (idea.up_votes, idea.down_votes + 1, idea.veto_count),
        VoteType::Veto => (idea.up_votes, idea.down_votes, idea.veto_count + 1),
    };
    let total_votes = idea.total_votes + 1;

    let computed_score = compute_idea_score(ctx, idea_id);

    if veto_count >= idea.veto_threshold {
        ctx.db.ideas().id().update(Idea {
            status: IdeaStatus::Rejected,
            up_votes,
            down_votes,
            veto_count,
            total_votes,
            computed_score,
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
            computed_score,
            updated_at: ctx.timestamp,
            ..idea
        });
        update_agent_activity(ctx, agent)?;
        return Ok(());
    }

    if computed_score >= get_approval_threshold(ctx) {
        let idea_title = idea.title.clone();

        ctx.db.ideas().id().update(Idea {
            status: IdeaStatus::ApprovedForProject,
            up_votes,
            down_votes,
            veto_count,
            total_votes,
            computed_score,
            updated_at: ctx.timestamp,
            ..idea
        });
        update_agent_activity(ctx, agent)?;

        send_system_message(
            ctx,
            format!(
                "Idea '{}' approved (score: {:.2})",
                idea_title, computed_score
            ),
            Some("general"),
        )?;
        send_system_message(
            ctx,
            format!(
                "Idea '{}' approved for project creation (score: {:.2}). Review and create project when ready.",
                idea_title, computed_score
            ),
            Some("zoe"),
        )?;
        return Ok(());
    }

    ctx.db.ideas().id().update(Idea {
        status: IdeaStatus::Rejected,
        up_votes,
        down_votes,
        veto_count,
        total_votes,
        computed_score,
        updated_at: ctx.timestamp,
        ..idea
    });

    update_agent_activity(ctx, agent)?;
    send_system_message(
        ctx,
        format!("Idea {} rejected (score: {:.2})", idea_id, computed_score),
        None,
    )?;
    Ok(())
}
