use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::activity::{count_active_agents, get_activity_window_days};
use crate::helpers::auth::require_role;
use crate::helpers::thresholds::calculate_thresholds;
use crate::tables::agent::agents;
use crate::tables::discovered_task::{DiscoveredTask, discovered_tasks};
use crate::tables::idea::{Idea, ideas};
use crate::tables::project::projects;
use crate::tables::task::{Task, tasks};
use crate::types::{AgentRole, DiscoveredTaskStatus, DiscoveryDecision, IdeaStatus, TaskStatus};

#[reducer]
pub fn review_discovered_task(
    ctx: &ReducerContext,
    discovery_id: u64,
    decision: DiscoveryDecision,
    reason: Option<String>,
) -> Result<(), String> {
    require_role(ctx, AgentRole::Admin)?;

    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let discovery = ctx
        .db
        .discovered_tasks()
        .id()
        .find(discovery_id)
        .ok_or("Discovery not found")?;

    if discovery.status != DiscoveredTaskStatus::PendingReview {
        return Err(format!(
            "Discovery already reviewed with status '{}'",
            discovery.status.as_str()
        ));
    }

    match decision {
        DiscoveryDecision::ApproveAsTask => {
            if ctx.db.projects().id().find(discovery.project_id).is_none() {
                return Err("Project not found".to_string());
            }

            let inserted = ctx.db.tasks().insert(Task {
                id: 0,
                project_id: discovery.project_id,
                title: discovery.title.clone(),
                description: discovery.description.clone(),
                status: TaskStatus::Open,
                assigned_to: None,
                claimed_at: None,
                github_issue_url: None,
                github_pr_url: None,
                priority: discovery.priority,
                source_idea_id: None,
                review_count: 0,
                blocked_from_status: None,
                archived_reason: None,
                status_changed_by: None,
                status_changed_at: None,
                created_at: ctx.timestamp,
                updated_at: ctx.timestamp,
                created_by: agent.id.clone(),
            });

            ctx.db.discovered_tasks().id().update(DiscoveredTask {
                status: DiscoveredTaskStatus::Approved,
                created_task_id: Some(inserted.id),
                reviewed_at: Some(ctx.timestamp),
                reviewed_by: Some(agent.id.clone()),
                ..discovery
            });
        }
        DiscoveryDecision::Reject => {
            ctx.db.discovered_tasks().id().update(DiscoveredTask {
                status: DiscoveredTaskStatus::Rejected,
                rejection_reason: reason,
                reviewed_at: Some(ctx.timestamp),
                reviewed_by: Some(agent.id.clone()),
                ..discovery
            });
        }
        DiscoveryDecision::EscalateToIdea => {
            let window_days = get_activity_window_days(ctx);
            let active_count = count_active_agents(ctx, window_days);
            let (quorum, approval_threshold, veto_threshold) = calculate_thresholds(active_count);

            ctx.db.ideas().insert(Idea {
                id: 0,
                title: discovery.title.clone(),
                description: discovery.description.clone(),
                category: discovery.task_type.clone(),
                status: IdeaStatus::Voting,
                active_agent_count: active_count,
                quorum,
                approval_threshold,
                veto_threshold,
                up_votes: 0,
                down_votes: 0,
                veto_count: 0,
                total_votes: 0,
                created_by: discovery.discovered_by.clone(),
                created_at: ctx.timestamp,
                updated_at: ctx.timestamp,
            });

            ctx.db.discovered_tasks().id().update(DiscoveredTask {
                status: DiscoveredTaskStatus::EscalatedToIdea,
                reviewed_at: Some(ctx.timestamp),
                reviewed_by: Some(agent.id.clone()),
                ..discovery
            });
        }
    }

    Ok(())
}
