use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::identity_role::{identity_roles, IdentityRole};
use crate::types::AgentRole;

const ZOE_IDENTITIES: &[&str] = &[
    "c20042e1bccdf9eeddb52cf0d58d99e8c31eeba188fd98bc91c206f86b3b8955",
    "c200c7d4c23d986d28a5f033f523a9b79eb4b8472df63cff2998518d27bdd0ba",
];

pub fn is_zoe_identity(identity: &Identity) -> bool {
    let identity_hex = identity.to_hex();
    ZOE_IDENTITIES
        .iter()
        .any(|z| identity_hex.to_string() == *z)
}

pub fn has_role(ctx: &ReducerContext, identity: &Identity, role: AgentRole) -> bool {
    if let Some(identity_role) = ctx.db.identity_roles().identity().find(identity) {
        match role {
            AgentRole::Zoe => identity_role.role == AgentRole::Zoe,
            AgentRole::Admin => {
                identity_role.role == AgentRole::Zoe || identity_role.role == AgentRole::Admin
            }
            AgentRole::Zeno => true,
        }
    } else {
        false
    }
}

pub fn require_role(ctx: &ReducerContext, role: AgentRole) -> Result<(), String> {
    if has_role(ctx, &ctx.sender(), role) {
        Ok(())
    } else {
        Err(format!("Requires {:?} role", role))
    }
}

pub fn get_role(ctx: &ReducerContext, identity: &Identity) -> Option<AgentRole> {
    ctx.db
        .identity_roles()
        .identity()
        .find(identity)
        .map(|ir| ir.role)
}

pub fn assign_role(
    ctx: &ReducerContext,
    identity: &Identity,
    role: AgentRole,
) -> Result<(), String> {
    if ctx.db.identity_roles().identity().find(identity).is_some() {
        return Err("Identity already has a role".to_string());
    }

    ctx.db.identity_roles().insert(IdentityRole {
        identity: *identity,
        role,
    });

    Ok(())
}

pub fn init_zoe_roles(ctx: &ReducerContext) {
    for identity_hex in ZOE_IDENTITIES {
        if let Ok(identity) = Identity::from_hex(identity_hex) {
            if ctx.db.identity_roles().identity().find(&identity).is_none() {
                ctx.db.identity_roles().insert(IdentityRole {
                    identity,
                    role: AgentRole::Zoe,
                });
            }
        }
    }
}
