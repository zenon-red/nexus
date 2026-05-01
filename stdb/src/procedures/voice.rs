use spacetimedb::{ProcedureContext, Table, procedure};

use crate::helpers::auth::get_role;
use crate::tables::agent::agents;
use crate::tables::agent_voice_counter::agent_voice_counters;
use crate::tables::agent_voice_counter::AgentVoiceCounter;
use crate::tables::voice_allowed_host::voice_allowed_hosts;
use crate::tables::voice_announcement::voice_announcements;
use crate::tables::voice_announcement::VoiceAnnouncement;
use crate::types::{AgentRole, AnnouncementStatus};

const MAX_TRANSCRIPT_LEN: usize = 500;

fn is_private_or_local_host(host: &str) -> bool {
    let h = host.to_ascii_lowercase();
    if h == "localhost" || h == "127.0.0.1" || h == "::1" {
        return true;
    }
    if h.starts_with("10.") || h.starts_with("192.168.") {
        return true;
    }
    if h.starts_with("172.") {
        let second = h
            .split('.')
            .nth(1)
            .and_then(|n| n.parse::<u8>().ok())
            .unwrap_or(0);
        if (16..=31).contains(&second) {
            return true;
        }
    }
    false
}

fn parse_and_validate_public_audio_url(url: &str) -> Result<String, String> {
    if !url.starts_with("https://") {
        return Err("audio_url must use https".to_string());
    }

    let rest = &url[8..];
    let host_port = rest
        .split('/')
        .next()
        .ok_or_else(|| "audio_url host missing".to_string())?;
    let host = host_port.split(':').next().unwrap_or_default();
    if host.is_empty() {
        return Err("audio_url host missing".to_string());
    }
    if is_private_or_local_host(host) {
        return Err("audio_url must not target localhost/private networks".to_string());
    }

    Ok(host.to_string())
}

fn sanitize_key_segment(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut prev_dash = false;

    for ch in input.chars() {
        let lower = ch.to_ascii_lowercase();
        if lower.is_ascii_alphanumeric() {
            out.push(lower);
            prev_dash = false;
        } else if !prev_dash {
            out.push('-');
            prev_dash = true;
        }
    }

    let trimmed = out.trim_matches('-');
    if trimmed.is_empty() {
        "agent".to_string()
    } else {
        trimmed.to_string()
    }
}

#[derive(spacetimedb::SpacetimeType, Clone, Debug)]
pub struct GenerateVoiceResult {
    pub id: u64,
    pub seq: u64,
    pub agent_name: String,
    pub key_prefix: String,
}

#[procedure]
pub fn generate_voice(
    ctx: &mut ProcedureContext,
    transcript: String,
    audio_url: Option<String>,
    context_type: Option<String>,
) -> Result<GenerateVoiceResult, String> {
    let sender = ctx.sender();

    let trimmed_transcript = transcript.trim();
    if trimmed_transcript.is_empty() {
        return Err("Transcript cannot be empty".to_string());
    }
    if trimmed_transcript.chars().count() > MAX_TRANSCRIPT_LEN {
        return Err(format!(
            "Transcript exceeds {} characters",
            MAX_TRANSCRIPT_LEN
        ));
    }

    let byo_host = if let Some(url) = audio_url.as_ref() {
        Some(parse_and_validate_public_audio_url(url.trim())?)
    } else {
        None
    };

    // Auth and sequence allocation happen inside a transaction.
    let result: Result<(String, u64, bool), String> = ctx.with_tx(|tx| {
        let role = get_role(tx, &sender);
        let tts_allowed = matches!(role, Some(AgentRole::Zoe));

        let agent = tx
            .db
            .agents()
            .identity()
            .find(sender)
            .ok_or_else(|| "Agent not found".to_string())?;

        // Determine if we can proceed
        match (audio_url.as_ref(), tts_allowed) {
            (Some(_), true) => {} // BYO allowed for Zoe
            (Some(_), false) => return Err("Only Zoe can create voice announcements".to_string()),
            (None, true) => {} // TTS allowed for Zoe
            (None, false) => {
                return Err("Only Zoe can create voice announcements".to_string());
            }
        }

        if let Some(host) = byo_host.as_ref() {
            if tx.db.voice_allowed_hosts().host().find(host.clone()).is_none() {
                return Err(format!("audio_url host is not allowlisted: {}", host));
            }
        }

        // Allocate per-agent sequence (retry-safe: counter update is rolled back on retry)
        let seq = if let Some(counter) = tx.db.agent_voice_counters().agent_id().find(sender) {
            let next = counter.next_seq;
            tx.db
                .agent_voice_counters()
                .agent_id()
                .update(AgentVoiceCounter {
                    next_seq: next + 1,
                    ..counter
                });
            next
        } else {
            tx.db.agent_voice_counters().insert(AgentVoiceCounter {
                agent_id: sender,
                next_seq: 1,
            });
            0
        };

        Ok((agent.name.clone(), seq, tts_allowed))
    });
    let (agent_name, seq, _tts_allowed) = result?;

    // Split architecture rationale:
    // - Provider-agnostic: caller chooses TTS provider and storage backend
    // - Secrets isolation: API keys stay in caller environment, never in STDB
    // - Operational simplicity: TTS generation and upload happen in caller's runtime
    //   where retries, large file handling, and provider-specific auth are easier
    let is_byo = audio_url.is_some();
    let final_url = audio_url.unwrap_or_default();
    let status = if is_byo {
        AnnouncementStatus::Ready
    } else {
        AnnouncementStatus::Pending
    };
    let transcript_owned = trimmed_transcript.to_string();
    let context_type_owned = context_type.clone();

    let id = ctx.with_tx(|tx| {
        let announcement = VoiceAnnouncement {
            id: 0,
            agent_id: sender,
            seq,
            agent_name: agent_name.clone(),
            transcript: transcript_owned.clone(),
            audio_url: final_url.clone(),
            status: status.clone(),
            context_type: context_type_owned.clone(),
            context_id: None,
            finalized_at: if is_byo { Some(tx.timestamp) } else { None },
            failed_at: None,
            error_message: None,
            created_at: tx.timestamp,
        };
        tx.db.voice_announcements().insert(announcement).id
    });

    let key_agent = sanitize_key_segment(&agent_name);
    let key_prefix = format!("voice/{}/{}", key_agent, seq);

    Ok(GenerateVoiceResult {
        id,
        seq,
        agent_name,
        key_prefix,
    })
}
