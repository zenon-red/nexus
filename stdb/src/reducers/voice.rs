use spacetimedb::{ReducerContext, reducer};

use crate::tables::voice_allowed_host::voice_allowed_hosts;
use crate::tables::voice_announcement::voice_announcements;
use crate::tables::voice_announcement::VoiceAnnouncement;
use crate::types::AnnouncementStatus;

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

/// Finalize a voice announcement after caller-side TTS generation and upload.
/// Only the original agent can finalize their own announcement.
#[reducer]
pub fn finalize_voice_announcement(
    ctx: &ReducerContext,
    announcement_id: u64,
    audio_url: String,
) -> Result<(), String> {
    let trimmed_url = audio_url.trim();
    if trimmed_url.is_empty() {
        return Err("audio_url cannot be empty".to_string());
    }

    let host = parse_and_validate_public_audio_url(trimmed_url)?;
    if ctx.db.voice_allowed_hosts().host().find(host.clone()).is_none() {
        return Err(format!("audio_url host is not allowlisted: {}", host));
    }

    let announcement = ctx
        .db
        .voice_announcements()
        .id()
        .find(announcement_id)
        .ok_or_else(|| "Announcement not found".to_string())?;

    if announcement.agent_id != ctx.sender() {
        return Err("Only the creating agent can finalize this announcement".to_string());
    }

    if !matches!(announcement.status, AnnouncementStatus::Pending) {
        return Err("Announcement is not in Pending state".to_string());
    }

    ctx.db.voice_announcements().id().update(VoiceAnnouncement {
        audio_url: trimmed_url.to_string(),
        status: AnnouncementStatus::Ready,
        finalized_at: Some(ctx.timestamp),
        ..announcement
    });

    Ok(())
}

/// Mark a voice announcement as failed.
/// Only the original agent can mark their own announcement as failed.
#[reducer]
pub fn fail_voice_announcement(
    ctx: &ReducerContext,
    announcement_id: u64,
    error_message: String,
) -> Result<(), String> {
    let trimmed_error = error_message.trim();
    if trimmed_error.is_empty() {
        return Err("error_message cannot be empty".to_string());
    }

    let announcement = ctx
        .db
        .voice_announcements()
        .id()
        .find(announcement_id)
        .ok_or_else(|| "Announcement not found".to_string())?;

    if announcement.agent_id != ctx.sender() {
        return Err("Only the creating agent can fail this announcement".to_string());
    }

    if !matches!(announcement.status, AnnouncementStatus::Pending) {
        return Err("Announcement is not in Pending state".to_string());
    }

    ctx.db.voice_announcements().id().update(VoiceAnnouncement {
        status: AnnouncementStatus::Failed,
        failed_at: Some(ctx.timestamp),
        error_message: Some(trimmed_error.to_string()),
        ..announcement
    });

    log::error!(
        "Voice announcement {} failed: {}",
        announcement_id,
        trimmed_error
    );

    Ok(())
}
