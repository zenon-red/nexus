use spacetimedb::{table, Identity};

use crate::types::AgentRole;

#[table(accessor = identity_roles, public)]
pub struct IdentityRole {
    #[primary_key]
    pub identity: Identity,
    pub role: AgentRole,
}
