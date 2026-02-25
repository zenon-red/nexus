use spacetimedb::{reducer, ReducerContext, Table};

use crate::helpers::auth::{assign_role, is_zoe_identity};
use crate::tables::agent::{agents, Agent};
use crate::tables::identity_role::identity_roles;
use crate::types::{AgentRole, AgentStatus};

#[reducer]
pub fn register_agent(
    ctx: &ReducerContext,
    agent_id: String,
    name: String,
    zenon_address: String,
    role: Option<AgentRole>,
) -> Result<(), String> {
    if agent_id.is_empty() || name.is_empty() {
        return Err("Agent ID and name required".to_string());
    }

    let requested_role = role.unwrap_or(AgentRole::Zeno);

    let validated_role = match requested_role {
        AgentRole::Zoe | AgentRole::Admin => {
            if !is_zoe_identity(&ctx.sender()) {
                return Err("Only whitelisted identities can register as zoe or admin".to_string());
            }
            requested_role
        }
        AgentRole::Zeno => AgentRole::Zeno,
    };

    if let Some(existing) = ctx.db.agents().id().find(&agent_id) {
        if existing.identity != ctx.sender() {
            return Err("Agent ID already registered by another identity".to_string());
        }
        ctx.db.agents().id().update(Agent {
            name,
            role: validated_role,
            zenon_address,
            last_heartbeat: ctx.timestamp,
            last_active_at: ctx.timestamp,
            ..existing
        });

        if ctx
            .db
            .identity_roles()
            .identity()
            .find(&ctx.sender())
            .is_none()
        {
            assign_role(ctx, &ctx.sender(), validated_role)?;
        }

        return Ok(());
    }

    if let Some(existing) = ctx.db.agents().identity().find(&ctx.sender()) {
        ctx.db.agents().id().update(Agent {
            id: agent_id.clone(),
            name,
            role: validated_role,
            zenon_address,
            last_heartbeat: ctx.timestamp,
            last_active_at: ctx.timestamp,
            ..existing
        });

        if ctx
            .db
            .identity_roles()
            .identity()
            .find(&ctx.sender())
            .is_none()
        {
            assign_role(ctx, &ctx.sender(), validated_role)?;
        }

        return Ok(());
    }

    ctx.db.agents().insert(Agent {
        id: agent_id.clone(),
        name,
        role: validated_role,
        capabilities: vec![],
        status: AgentStatus::Online,
        zenon_address,
        identity: ctx.sender(),
        last_heartbeat: ctx.timestamp,
        current_task_id: None,
        created_at: ctx.timestamp,
        last_active_at: ctx.timestamp,
    });

    if ctx
        .db
        .identity_roles()
        .identity()
        .find(&ctx.sender())
        .is_none()
    {
        assign_role(ctx, &ctx.sender(), validated_role)?;
    }

    log::info!("Agent registered: {}", agent_id);
    Ok(())
}
