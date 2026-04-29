use spacetimedb::ReducerContext;

use crate::tables::config::config;
use crate::tables::evaluation_dimension::{EvaluationDimension, evaluation_dimensions};
use crate::tables::vote::{Vote, votes};
use crate::types::{DimensionScore, VoteType};

fn valid_dimensions(ctx: &ReducerContext) -> Vec<EvaluationDimension> {
    ctx.db
        .evaluation_dimensions()
        .by_active()
        .filter(&true)
        .filter(|d| d.weight > 0.0 && d.max_score > d.min_score)
        .collect()
}

fn weighted_score(scores: &[DimensionScore], dimensions: &[EvaluationDimension]) -> Option<f64> {
    let total_weight: f64 = dimensions.iter().map(|d| d.weight).sum();
    if total_weight == 0.0 {
        return None;
    }

    let weighted_sum = dimensions.iter().fold(0.0, |sum, dim| {
        let raw_score = scores
            .iter()
            .find(|s| s.dimension == dim.name)
            .map(|s| s.score as f64)
            .unwrap_or_else(|| ((dim.min_score + dim.max_score) as f64) / 2.0)
            .clamp(dim.min_score as f64, dim.max_score as f64);

        let range = dim.max_score as f64 - dim.min_score as f64;
        sum + dim.weight * ((raw_score - dim.min_score as f64) / range)
    });

    Some((weighted_sum / total_weight) * 10.0)
}

/// Compute the aggregated score for an idea based on dimension scores
/// attached to all votes for that idea.
///
/// Formula: weighted average of normalized dimension scores, averaged across voters,
/// then scaled to a 0-10 range.
pub fn compute_idea_score(ctx: &ReducerContext, idea_id: u64) -> f64 {
    let votes: Vec<Vote> = ctx.db.votes().by_idea().filter(&idea_id).collect();

    if votes.is_empty() {
        return 0.0;
    }

    let dimensions = valid_dimensions(ctx);
    if dimensions.is_empty() {
        return 0.0;
    }

    let mut aggregate = 0.0;

    for vote in &votes {
        aggregate += weighted_score(&vote.scores, &dimensions).unwrap_or(0.0);
    }

    aggregate / votes.len() as f64
}

/// Derive a vote type from a set of dimension scores.
///
/// - If any dimension scores at or below the veto floor, it's a Veto.
/// - If the aggregate meets the approval threshold, it's Up.
/// - Otherwise, it's Down.
pub fn derive_vote_type(ctx: &ReducerContext, scores: &[DimensionScore]) -> VoteType {
    let veto_floor = ctx
        .db
        .config()
        .key()
        .find("idea_veto_floor".to_string())
        .and_then(|c| c.value.parse::<u8>().ok())
        .unwrap_or(2);

    for score in scores {
        if score.score <= veto_floor {
            return VoteType::Veto;
        }
    }

    let approval = ctx
        .db
        .config()
        .key()
        .find("idea_approval_score_threshold".to_string())
        .and_then(|c| c.value.parse().ok())
        .unwrap_or(7.0);

    if weighted_score(scores, &valid_dimensions(ctx)).unwrap_or(0.0) >= approval {
        VoteType::Up
    } else {
        VoteType::Down
    }
}

/// Read the approval score threshold from Config.
pub fn get_approval_threshold(ctx: &ReducerContext) -> f64 {
    ctx.db
        .config()
        .key()
        .find("idea_approval_score_threshold".to_string())
        .and_then(|c| c.value.parse().ok())
        .unwrap_or(7.0)
}
