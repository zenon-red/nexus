use spacetimedb::table;

/// Private allowlist for approved public audio hosts.
#[table(accessor = voice_allowed_hosts)]
pub struct VoiceAllowedHost {
    #[primary_key]
    pub host: String,
}
