use spacetimedb::{ReducerContext, Table, reducer};

pub mod helpers;
pub mod reducers;
pub mod tables;
pub mod types;

use crate::helpers::auth::init_zoe_roles;
use crate::tables::agent::{Agent, agents};
use crate::tables::channel::{Channel, channels};
use crate::tables::config::{Config, config};
use crate::types::AgentStatus;

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
