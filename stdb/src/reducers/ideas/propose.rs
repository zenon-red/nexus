use spacetimedb::{ReducerContext, Table, reducer};

use crate::helpers::activity::{
    count_active_agents, get_activity_window_days, update_agent_activity,
};
use crate::helpers::thresholds::calculate_thresholds;
use crate::reducers::messaging::send::send_system_message;
use crate::tables::agent::agents;
use crate::tables::idea::{Idea, ideas};
use crate::types::IdeaStatus;

#[reducer]
pub fn propose_idea(
    ctx: &ReducerContext,
    title: String,
    description: String,
    category: String,
) -> Result<(), String> {
    let agent = ctx
        .db
        .agents()
        .identity()
        .find(ctx.sender())
        .ok_or("Agent not found")?;

    let window_days = get_activity_window_days(ctx);
    let active_count = count_active_agents(ctx, window_days);
    let (quorum, approval_threshold, veto_threshold) = calculate_thresholds(active_count);

    let inserted = ctx.db.ideas().insert(Idea {
        id: 0,
        title: title.clone(),
        description,
        category,
        status: IdeaStatus::Voting,
        active_agent_count: active_count,
        quorum,
        approval_threshold,
        veto_threshold,
        up_votes: 0,
        down_votes: 0,
        veto_count: 0,
        total_votes: 0,
        created_by: agent.id.clone(),
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    update_agent_activity(ctx, agent)?;
    send_system_message(ctx, format!("New idea proposed: {}", inserted.id), None)?;
    Ok(())
}
