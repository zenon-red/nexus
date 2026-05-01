use spacetimedb::{ReducerContext, Table, reducer};

pub mod helpers;
pub mod procedures;
pub mod reducers;
pub mod tables;
pub mod types;

use crate::helpers::auth::init_zoe_roles;
use crate::tables::agent::{Agent, agents};
use crate::tables::channel::{Channel, channels};
use crate::tables::config::{Config, config};
use crate::tables::evaluation_dimension::{EvaluationDimension, evaluation_dimensions};
use crate::tables::voice_allowed_host::{VoiceAllowedHost, voice_allowed_hosts};
use crate::tables::vote::{Vote, votes};
use crate::types::{AgentStatus, DimensionScore};

#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    log::info!("Nexus module initializing...");

    init_zoe_roles(ctx);

    if ctx
        .db
        .channels()
        .by_name()
        .filter(&"general".to_string())
        .next()
        .is_none()
    {
        ctx.db.channels().insert(Channel {
            id: 0,
            name: "general".to_string(),
            created_by: "system".to_string(),
            created_at: ctx.timestamp,
        });
    }

    if ctx
        .db
        .channels()
        .by_name()
        .filter(&"zoe".to_string())
        .next()
        .is_none()
    {
        ctx.db.channels().insert(Channel {
            id: 0,
            name: "zoe".to_string(),
            created_by: "system".to_string(),
            created_at: ctx.timestamp,
        });
    }

    if ctx
        .db
        .config()
        .key()
        .find("activity_window_days".to_string())
        .is_none()
    {
        ctx.db.config().insert(Config {
            key: "activity_window_days".to_string(),
            value: "7".to_string(),
        });
    }

    if ctx
        .db
        .config()
        .key()
        .find("idea_approval_score_threshold".to_string())
        .is_none()
    {
        ctx.db.config().insert(Config {
            key: "idea_approval_score_threshold".to_string(),
            value: "7.0".to_string(),
        });
    }

    if ctx
        .db
        .config()
        .key()
        .find("idea_veto_floor".to_string())
        .is_none()
    {
        ctx.db.config().insert(Config {
            key: "idea_veto_floor".to_string(),
            value: "2".to_string(),
        });
    }

    if ctx
        .db
        .voice_allowed_hosts()
        .host()
        .find("audio.zenon.red".to_string())
        .is_none()
    {
        ctx.db.voice_allowed_hosts().insert(VoiceAllowedHost {
            host: "audio.zenon.red".to_string(),
        });
    }

    let default_dimensions = [
        (
            "ecosystem_impact",
            "Ecosystem Impact",
            1.0,
            "How much does this strengthen the broader Zenon ecosystem?",
            0,
        ),
        (
            "implementation_readiness",
            "Implementation Readiness",
            0.8,
            "How ready is the codebase and tooling for this work? Higher scores mean fewer unknowns and less scaffolding needed.",
            1,
        ),
        (
            "dependency_independence",
            "Dependency Independence",
            0.6,
            "How self-contained is this work? Higher scores mean fewer external or cross-team blockers.",
            2,
        ),
        (
            "documentation_leverage",
            "Documentation Leverage",
            0.7,
            "Does this improve shared knowledge and reduce future onboarding cost?",
            3,
        ),
        (
            "maintenance_sustainability",
            "Maintenance Sustainability",
            0.7,
            "How sustainable is this long-term? Higher scores mean lower ongoing cost and fewer compounding issues.",
            4,
        ),
        (
            "agent_capability_fit",
            "Agent Capability Fit",
            0.75,
            "Could the current agent pool deliver this? Do agents have the context, tools, and skills to implement it now?",
            5,
        ),
        (
            "execution_clarity",
            "Execution Clarity",
            1.0,
            "Are requirements, acceptance criteria, test oracle, context links, and boundaries clear enough for an agent to execute without inventing missing intent?",
            6,
        ),
    ];

    let renamed_dimensions = [
        ("implementation_difficulty", "implementation_readiness"),
        ("dependency_risk", "dependency_independence"),
        ("maintenance_cost", "maintenance_sustainability"),
    ];
    for (old_name, _) in &renamed_dimensions {
        if let Some(dim) = ctx
            .db
            .evaluation_dimensions()
            .iter()
            .find(|d| d.name == *old_name && d.active)
        {
            ctx.db
                .evaluation_dimensions()
                .id()
                .update(EvaluationDimension {
                    active: false,
                    ..dim
                });
        }
    }

    for (name, label, weight, description, sort_order) in default_dimensions.iter() {
        if ctx
            .db
            .evaluation_dimensions()
            .iter()
            .any(|d| d.name == *name)
        {
            continue;
        }
        ctx.db.evaluation_dimensions().insert(EvaluationDimension {
            id: 0,
            name: name.to_string(),
            label: label.to_string(),
            weight: *weight,
            min_score: 1,
            max_score: 10,
            description: description.to_string(),
            active: true,
            sort_order: *sort_order,
        });
    }

    let needs_migration = ctx.db.votes().iter().any(|vote| {
        vote.scores.iter().any(|score| {
            renamed_dimensions
                .iter()
                .any(|(old_name, _)| score.dimension == *old_name)
        })
    });

    if needs_migration {
        for vote in ctx.db.votes().iter() {
            let mut changed = false;
            let mut migrated_scores: Vec<DimensionScore> = Vec::new();

            for mut score in vote.scores.clone() {
                if let Some((_, new_name)) = renamed_dimensions
                    .iter()
                    .find(|(old_name, _)| score.dimension == *old_name)
                {
                    if vote.scores.iter().any(|s| s.dimension == *new_name)
                        || migrated_scores.iter().any(|s| s.dimension == *new_name)
                    {
                        changed = true;
                        continue;
                    }
                    score.dimension = new_name.to_string();
                    changed = true;
                }

                if migrated_scores
                    .iter()
                    .any(|existing| existing.dimension == score.dimension)
                {
                    changed = true;
                    continue;
                }

                migrated_scores.push(score);
            }

            if changed {
                ctx.db.votes().id().update(Vote {
                    scores: migrated_scores,
                    ..vote
                });
            }
        }
    }

    log::info!("Default channels and config created");
}

#[reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) {
    log::info!("Client connected: {:?}", ctx.sender());

    if let Some(agent) = ctx.db.agents().identity().find(ctx.sender()) {
        ctx.db.agents().id().update(Agent {
            status: AgentStatus::Online,
            last_heartbeat: ctx.timestamp,
            ..agent
        });
    }
}

#[reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    log::info!("Client disconnected: {:?}", ctx.sender());

    if let Some(agent) = ctx.db.agents().identity().find(ctx.sender()) {
        ctx.db.agents().id().update(Agent {
            status: AgentStatus::Offline,
            ..agent
        });
    }
}
