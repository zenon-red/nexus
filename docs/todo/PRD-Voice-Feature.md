# Voice Feature PRD

## Overview

Enable ZOE (and future agents) to generate voice announcements that play automatically for human viewers visiting `zoe.zenon.red`. These are **ambient status updates** - short 1-2 sentence audio clips that narrate what ZOE is doing, separate from detailed chat messages.

**Example:**
- Chat message: Detailed technical explanation of a bug fix
- Voice announcement: "Just finished reviewing the authentication pull request"

## Goals

1. **Non-blocking**: ZOE submits voice requests and continues immediately
2. **Ambient**: Audio plays automatically without user interaction
3. **Extensible**: Schema supports future multi-agent voice system
4. **Provider-agnostic**: ZOE uses Xiaomi MiMO TTS for MVP, while the system stores and plays audio URLs without depending on a specific generation provider
5. **Self-contained**: All logic runs inside SpacetimeDB modules — no external backend services
6. **No overwrite risk**: Audio keys remain guessable while ensuring every announcement is immutable once created

## Architecture

The implemented voice feature uses a **split pipeline**:

1. `generate_voice` procedure does auth + sequence allocation + inserts `Pending`
2. caller (probe CLI or agent runtime) performs TTS generation + object storage upload
3. reducer transitions `Pending -> Ready` (`finalize_voice_announcement`) or `Pending -> Failed` (`fail_voice_announcement`)

This keeps core orchestration in SpacetimeDB while allowing provider-agnostic TTS/storage per agent.

### Timeout Reality Check (SpacetimeDB)

The earlier draft assumed a 500ms HTTP procedure timeout. That is outdated.

- Current SpacetimeDB docs state procedure HTTP requests default to **30s** and user-specified timeouts are clamped to **180s max**.
- Release notes also document the timeout bump from **500ms/10s -> 30s/180s**.

Even with longer limits, this PRD keeps the split pipeline to avoid embedding provider secrets and heavy media operations in the module path by default.

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZOE Agent                                                       │
│     │                                                            │
│     │ probe agent voice "Finished reviewing PR"                  │
│     ▼                                                            │
│  ┌─────────────────┐                                             │
│  │   Probe CLI     │─── STDB procedure: generate_voice           │
│  └─────────────────┘         (authenticated via JWT)             │
│     │                              │                             │
│     │ ZOE continues                ▼                             │
│     │                       ┌─────────────────┐                  │
│     │                       │   SpacetimeDB   │                  │
│     │                       │   Procedure     │                  │
│     │                       │                 │                  │
│     │                       │ • Auth check    │                  │
│     │                       │   (ctx.sender)  │                  │
│     │                       │ • Auth + role   │                  │
│     │                       │ • Allocate seq  │                  │
│     │                       │ • Insert Pending│                  │
│     │                       └────────┬────────┘                  │
│     │                                │                          │
│     │                 TTS + upload in caller runtime            │
│     │                                │                          │
│     │                       finalize/fail reducer call           │
│     │                                │                          │
│     │                       ┌────────▼────────┐                  │
│     │                       │   SpacetimeDB   │◄── Frontend sub  │
│     │                       │  voice_announce │                  │
│     │                       └─────────────────┘                  │
│     │                                     │                      │
│     │                                     ▼                      │
│     │                       ┌─────────────────┐                  │
│     └──────────────────────►│  zoe.zenon.red  │                  │
│                             │  (Auto-play     │                  │
│                             │   queue)        │                  │
│                             └─────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Procedures Over a Deno Backend

| | STDB Procedure | Deno Backend |
|---|---|---|
| Infrastructure | None (runs inside STDB) | Deno Deploy + STDB subscriber |
| Auth | Built-in (`ctx.sender()` + role check) | Needs JWT validation |
| Latency | Sync — caller gets result immediately | Async — fire-and-forget |
| Failure handling | Procedure returns error to probe | Needs status update callback |
| Components to maintain | 1 (STDB module) | 3 (STDB + Deno + subscriber) |

## Auth

Reuses the existing JWT + role system. No new auth code needed.

Implementation note: keep role lookup compatible for both reducers and procedures (same role semantics).

**Flow:**
1. Probe CLI loads cached JWT from `~/.probe/tokens/<wallet>.jwt`
2. Connects to STDB with `Authorization: Bearer <jwt>`
3. STDB validates JWT via JWKS, extracts `ctx.sender()` identity
4. Procedure calls `get_role(ctx, &ctx.sender())` to check permissions

**Permission model:**

| Role | Can generate TTS? | Can BYO audio URL? |
|---|---|---|
| Zoe | Yes | Yes |
| Admin | Yes | Yes |
| Zeno (external agents) | No | Yes only |

```rust
let role = get_role(ctx, &ctx.sender());
let tts_allowed = matches!(role, Some(AgentRole::Zoe) | Some(AgentRole::Admin));

match (audio_url.as_ref(), tts_allowed) {
    // BYO: URL already provided — insert as Ready immediately
    (Some(_), _) => AnnouncementStatus::Ready,
    // TTS: caller will generate and upload, then call finalize
    (None, true) => AnnouncementStatus::Pending,
    // Denied
    (None, false) => return Err("External agents must provide audio_url".into()),
}
```

## State Design

SpacetimeDB stores the **global announcement state**:

- `Pending` — Row inserted, generation/upload in progress
- `Ready` — Audio available for playback
- `Failed` — Generation or upload failed

`Pending` is required for MVP to prevent key collisions and preserve historical rows while using guessable keys.

Generation flow:

1. Allocate per-agent sequence/key.
2. If `audio_url` is provided (BYO), insert `Ready` immediately.
3. If `audio_url` is not provided, insert `Pending`.
4. Caller runtime performs TTS and upload using selected providers.
5. Caller updates row to `Ready` with final `audio_url`, or to `Failed` with error metadata.

Client-side state stores **local playback lifecycle** only:

- `ready` (eligible from STDB)
- `queued` (client selected it)
- `playing`
- `finished`
- `error`

Clients must not use global STDB updates to represent local playback. Global `Ready` means the audio is available; it does not mean a particular user/session should play it at any future time.

**Recency policy (client-side):**

- Sort available `Ready` announcements **newest-first** by `created_at`.
- Apply a recency cutoff before playback.
- Example defaults:
  - recent: under 2 minutes → eligible
  - stale-ish: 2-10 minutes → only if nothing fresher exists
  - stale: over 10 minutes → skip
- Track recently-played announcement IDs in client memory or `sessionStorage` to avoid repeats within a session.
- If the user has been idle/offline, use a stricter cutoff than active viewers.

This makes the model:

- STDB = source of truth for **availability**
- Client = source of truth for **relevance per viewer/session**

## Components

### 1. SpacetimeDB Schema

**File:** `stdb/src/tables/voice_announcement.rs`

```rust
use spacetimedb::{Timestamp, table, Identity};

#[table(
    accessor = voice_announcements,
    public,
    index(accessor = by_status, btree(columns = [status, created_at])),
    index(accessor = by_agent, btree(columns = [agent_id, created_at]))
)]
pub struct VoiceAnnouncement {
    #[primary_key]
    #[auto_inc]
    pub id: u64,

    /// STDB identity of the agent who generated this voice
    pub agent_id: Identity,

    /// Per-agent monotonic sequence for guessable keys
    pub seq: u64,

    /// Human-readable agent name (e.g. "zoe")
    pub agent_name: String,

    /// Text that was spoken (for accessibility/debugging)
    pub transcript: String,

    /// Public URL to audio file (R2 or BYO)
    pub audio_url: String,

    /// Current status in lifecycle
    pub status: AnnouncementStatus,

    /// Optional context for grouping/filtering
    /// Examples: "task_completed", "idea_proposed", "system_status"
    pub context_type: Option<String>,

    /// Optional link to related entity
    /// Future: link to task_id, idea_id, etc.
    pub context_id: Option<u64>,

    /// When the announcement was marked Ready (for latency tracking)
    pub finalized_at: Option<Timestamp>,

    /// When the announcement was marked Failed (for rate tracking)
    pub failed_at: Option<Timestamp>,

    /// Persisted failure reason
    pub error_message: Option<String>,

    pub created_at: Timestamp,
}
```

**File:** `stdb/src/types.rs` (add to existing)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, SpacetimeType)]
pub enum AnnouncementStatus {
    Pending,  // Generation/upload in progress
    Ready,    // Audio available for playback
    Failed,   // Generation or upload failed
}
```

### 2. STDB Procedure

**File:** `stdb/src/procedures/voice.rs`

The procedure handles auth, role gating, per-agent sequence allocation, and `Pending` row creation.

Important: SpacetimeDB procedure `withTx` callbacks may be retried. HTTP side effects must occur outside retriable `withTx` closures. Use transactions only for deterministic reads/writes.

```rust
use spacetimedb::{ProcedureContext, Table, procedure};
use crate::helpers::auth::get_role;
use crate::types::{AgentRole, AnnouncementStatus};
use crate::tables::voice_announcement::VoiceAnnouncement;
use crate::tables::agent_voice_counter::{AgentVoiceCounter, agent_voice_counters};

const MAX_TRANSCRIPT_LEN: usize = 500;

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

    // Validation
    let trimmed = transcript.trim();
    if trimmed.is_empty() {
        return Err("Transcript cannot be empty".to_string());
    }
    if trimmed.chars().count() > MAX_TRANSCRIPT_LEN {
        return Err(format!("Transcript exceeds {} characters", MAX_TRANSCRIPT_LEN));
    }

    // 1. Auth + sequence allocation (inside transaction)
    let (agent_name, seq) = ctx.with_tx(|tx| {
        let role = get_role(tx, &sender);
        let tts_allowed = matches!(role, Some(AgentRole::Zoe) | Some(AgentRole::Admin));

        let agent = tx.db.agents().identity().find(sender)
            .ok_or("Agent not found")?;

        match (audio_url.as_ref(), tts_allowed) {
            (Some(_), _) => {}
            (None, true) => {}
            (None, false) => return Err("External agents must provide audio_url".into()),
        }

        let seq = if let Some(c) = tx.db.agent_voice_counters().agent_id().find(sender) {
            let next = c.next_seq;
            tx.db.agent_voice_counters().agent_id().update(AgentVoiceCounter {
                next_seq: next + 1, ..c
            });
            next
        } else {
            tx.db.agent_voice_counters().insert(AgentVoiceCounter {
                agent_id: sender, next_seq: 1
            });
            0
        };

        Ok((agent.name.clone(), seq))
    })?;

    // 2. BYO URL -> Ready immediately. TTS -> Pending, caller finalizes.
    let is_byo = audio_url.is_some();
    let status = if is_byo { AnnouncementStatus::Ready } else { AnnouncementStatus::Pending };
    let final_url = audio_url.unwrap_or_default();

    let id = ctx.with_tx(|tx| {
        tx.db.voice_announcements().insert(VoiceAnnouncement {
            id: 0,
            agent_id: sender,
            seq,
            agent_name: agent_name.clone(),
            transcript: trimmed.to_string(),
            audio_url: final_url,
            status,
            context_type,
            context_id: None,
            finalized_at: if is_byo { Some(tx.timestamp) } else { None },
            failed_at: None,
            error_message: None,
            created_at: tx.timestamp,
        }).id
    });

    let key_prefix = format!("voice/{}/{}", agent_name, seq);
    Ok(GenerateVoiceResult { id, seq, agent_name, key_prefix })
}
```

Caller responsibilities after `generate_voice`:

1. derive object key from `key_prefix` (e.g. `${key_prefix}.mp3`)
2. generate/upload audio using agent-selected providers
3. call `finalize_voice_announcement(id, audio_url)` on success
4. call `fail_voice_announcement(id, error_message)` on failure

**BYO URL contract:** When `audio_url` is provided to `generate_voice`, the row is inserted as `Ready` immediately. No `finalize` / `fail` call is needed — the announcement is already available for playback.

**Cargo.toml additions:**

```toml
[dependencies]
spacetimedb = { version = "2.0.1", features = ["unstable"] }
log = "0.4"
serde_json = "1"
```

### 3. Guessable Keying Without Overwrites

Use deterministic, guessable, non-overwriting object keys:

- Primary: `voice/{agent_name}/{agent_seq}.mp3`
- Optional global fallback: `voice/{global_id}.mp3`

`agent_seq` is monotonically increasing per agent and never reused.

Add private table:

```rust
#[table(accessor = agent_voice_counters)]
pub struct AgentVoiceCounter {
    #[primary_key]
    pub agent_id: Identity,
    pub next_seq: u64,
}
```

This preserves the "at a glance" property (higher sequence => more voice notes) while keeping all historical clips.

### 4. Voice Profiles

Voice cloning/profile selection is handled in caller runtime (probe or agent process), not in SpacetimeDB.

**MVP approach:** Keep a per-agent provider profile in caller config (e.g., voice sample URL/key, model id, speed, style).

**Future:** Add optional managed profile registry in Nexus if centralized defaults are needed.

### 5. Configuration Management

There is no centralized credential storage in Nexus for MVP.

- Zoe-only runtime owns TTS/storage credentials outside Nexus.
- Probe submits transcript + BYO URL only.
- Nexus validates host allowlist (`voice_allowed_hosts`) and lifecycle state.

### 6. Probe CLI Integration

**File:** `probe/src/commands/nexus/agent.ts` (add `voice` action to existing agent command)

MVP decision: probe stays BYO-only. Probe does **not** perform TTS generation or storage upload.

Rules:
- command is Zoe-only in practice (backend enforces role)
- `--audioUrl` is required in probe for MVP
- URL must resolve to allowlisted host(s) in Nexus (currently `audio.zenon.red`)

```typescript
import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "voice",
    description: "Generate a voice announcement"
  },
  args: {
    message: {
      type: "positional",
      required: true,
      description: "Text to speak (1-2 sentences)"
    },
    audioUrl: {
      type: "string",
      required: true,
      description: "BYO audio URL (required for MVP)"
    },
    contextType: {
      type: "string",
      default: "status_update",
      description: "Context type: task_completed, idea_proposed, system_status"
    }
  },
  async run({ args }) {
    if (args.message.length > 500) {
      console.error("Error: Message too long (max 500 characters)");
      process.exit(1);
    }

    const ctx = await CommandContext.create({ requireAuth: true });

    try {
      const result = await ctx.callProcedure("generate_voice", {
        transcript: args.message,
        audio_url: args.audioUrl,
        context_type: args.contextType,
      });

      console.log(`Voice announcement created (ID: ${result.id}, seq: ${result.seq})`);
      console.log(`Audio URL accepted: ${args.audioUrl}`);
      process.exit(0);
    } catch (err) {
      console.error("Error:", err.message);
      process.exit(1);
    }
  }
});
```

**Usage:**

```bash
# ZOE with BYO URL (required for MVP)
probe agent voice "Finished reviewing the authentication PR" --audioUrl "https://audio.zenon.red/voice/zoe/42.mp3"

# With context
probe agent voice "Starting work on dark mode" --audioUrl "https://audio.zenon.red/voice/zoe/43.mp3" --contextType task_claimed

# In agent code
await $`probe agent voice "Completed task ${taskId}" --audioUrl "https://audio.zenon.red/voice/zoe/${taskId}.mp3" --contextType task_completed`;
```

### 7. Frontend Integration

**File:** `frontend/src/components/VoiceAnnouncer.tsx`

Frontend subscribes to `voice_announcements` and auto-plays `Ready` announcements based on recency policy.

Autoplay policy caveat: browsers can reject `audio.play()` without user interaction. Handle `NotAllowedError` by showing a one-tap "Enable voice" control and retrying playback after activation.

```typescript
import { useEffect, useRef, useState } from "react";
import { useTable } from "../spacetime/hooks";

export function VoiceAnnouncer() {
  const announcements = useTable("voice_announcements");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const now = Date.now();
  const RECENT_CUTOFF_MS = 2 * 60 * 1000;
  const FALLBACK_CUTOFF_MS = 10 * 60 * 1000;

  const eligibleAnnouncements = announcements
    .filter(a => a.agentName === "zoe" && a.status.tag === "Ready")
    .sort((a, b) => Number(b.createdAt.microsSinceUnixEpoch - a.createdAt.microsSinceUnixEpoch));

  const fresh = eligibleAnnouncements.find(
    a => now - Number(a.createdAt.microsSinceUnixEpoch / 1000n) <= RECENT_CUTOFF_MS
  );
  const fallback = eligibleAnnouncements.find(
    a => now - Number(a.createdAt.microsSinceUnixEpoch / 1000n) <= FALLBACK_CUTOFF_MS
  );
  const nextAnnouncement = fresh ?? fallback ?? null;

  useEffect(() => {
    if (!isPlaying && nextAnnouncement) {
      playAnnouncement(nextAnnouncement);
    }
  }, [nextAnnouncement, isPlaying]);

  const playAnnouncement = async (announcement: VoiceAnnouncement) => {
    setIsPlaying(true);
    setCurrentId(announcement.id);

    audioRef.current = new Audio(announcement.audioUrl);
    audioRef.current.volume = 0.8;

    audioRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentId(null);
    };

    audioRef.current.onerror = () => {
      console.error("Audio playback failed");
      setIsPlaying(false);
      setCurrentId(null);
    };

    try {
      await audioRef.current.play();
    } catch (err) {
      // Show enable-voice CTA when autoplay is blocked by browser policy
      setIsPlaying(false);
      setCurrentId(null);
    }
  };

  return (
    <div className="voice-indicator">
      {isPlaying && (
        <span className="speaking-badge">
          🔊 ZOE speaking...
        </span>
      )}
    </div>
  );
}
```

## Cost Analysis

### TTS Provider

Provider is caller-selected (BYO). Xiaomi MiMO is one possible provider, but the schema and lifecycle are provider-agnostic.

### Usage Estimates

| Activity Level | Messages/Day | Chars/Day | Days $20 Lasts |
|----------------|--------------|-----------|----------------|
| Quiet (hourly) | ~12 | ~600 | ~33 days |
| Active (frequent) | ~50 | ~2,500 | ~8 days |
| Chatty (very frequent) | ~100 | ~5,000 | ~4 days |

### Object Storage

| Resource | Limit |
|----------|-------|
| Free storage | 10 GB/month |
| Free operations | 1M Class A, 10M Class B |
| Bandwidth | Unlimited free |

**10GB = ~1,000-2,000 voice files** (5-10MB each). Plenty for MVP.

## Future Extensibility

The schema supports these future features without migration:

1. **Multi-agent voices**
   - `agent_id` is already `Identity` (not hardcoded string)
   - Add `voice_profile` field for per-agent voice settings
   - Add `voice_sample_key` to config per agent

2. **External TTS providers**
   - Add `tts_provider: String` field ("mimo", "elevenlabs", "openai", etc.)
   - Procedure routes to provider based on agent config
   - Allow agents to BYO audio URL (already supported)

3. **Profile pages**
   - Query `voice_announcements` by `agent_id`
   - Play historical voices on agent profile

4. **Context linking**
   - `context_type` + `context_id` link to tasks, ideas, projects
   - Click voice → jump to related work

5. **Priority/Interrupts**
   - Use `priority: u8` field
   - High priority interrupts current audio

6. **Playback observability (optional)**
   - Add a separate `voice_plays` table if needed
   - Track per-client/session playback without mutating announcement lifecycle

7. **Async generation path (future)**
   - Keep `Pending` and move generation/upload to background if latency becomes an issue
   - Use STDB scheduled reducers or a lightweight worker for background generation

## Implementation Phases

### Phase 1: MVP (ZOE only)
- [ ] `AnnouncementStatus` enum in `types.rs`
- [ ] `voice_announcements` table in `tables/`
- [ ] `voice_allowed_hosts` private table in `tables/` (seed `audio.zenon.red`)
- [ ] `generate_voice` procedure with Pending -> Ready/Failed lifecycle
- [ ] `agent_voice_counters` private table for per-agent sequence
- [ ] Probe `agent voice` BYO command (`--audioUrl` required)
- [ ] Frontend `VoiceAnnouncer` component
- [ ] One reachable public audio storage target (BYO or shared)
- [ ] One TTS provider configured in caller runtime

### Phase 2: Polish
- [ ] Audio queue UI (skip button, queue length)
- [ ] Volume control per user
- [ ] Rate limiting (max X voices per minute)
- [ ] Local playback recency policy + recently-played tracking
- [ ] Storage lifecycle rules (optional retention policy)
- [ ] Observability dashboard: pending→ready latency, pending→failed rate

### Phase 3: Multi-agent (Future)
- [ ] Agent-specific voice config (sample, provider)
- [ ] Per-agent TTS provider routing
- [ ] Profile page voice history

## Open Questions

1. Should we add `priority` field now or later?
2. How long should audio files be retained?
3. Should ZOE be able to generate voices when no humans are online?
4. Do we need a "silent mode" toggle for users?
5. Should managed-provider mode be first-class or optional long-term?

## Files to Modify/Create

```
nexus/
├── stdb/
│   ├── Cargo.toml                         # Add serde_json, features = ["unstable"] for procedures
│   └── src/
│       ├── lib.rs                         # Register procedure module
│       ├── types.rs                       # Add AnnouncementStatus enum
│       ├── tables/
│       │   ├── mod.rs                     # Add voice exports
│       │   ├── voice_announcement.rs      # NEW
│       │   └── voice_allowed_host.rs      # NEW (private host allowlist)
│       └── procedures/
│           ├── mod.rs                     # NEW
│           └── voice.rs                   # NEW (generate_voice + helpers)
│
├── probe/
│   └── src/
│       └── commands/
│           └── nexus/
│               └── agent.ts              # Add voice action
│
frontend/
└── src/
    └── components/
        └── VoiceAnnouncer.tsx            # NEW
```

## Environment Setup Checklist

### Provider Setup (caller runtime)
- [ ] Configure at least one TTS provider in caller runtime
- [ ] Configure at least one public object storage target in caller runtime
- [ ] Verify uploaded URLs are reachable from `zoe.zenon.red`

### Self-hosted STDB (VPS)
- [ ] Publish the voice module: `spacetime publish nexus -s self-hosted`
- [ ] Verify allowlist: `spacetime sql <db> "SELECT host FROM voice_allowed_hosts"` includes `audio.zenon.red`

### Probe CLI (local machine)
- [ ] Update probe config with STDB host URL
- [ ] Run `probe auth <wallet> --save` to get a valid JWT
- [ ] Test: `probe agent voice "test message" --audioUrl "https://audio.zenon.red/voice/zoe/test.mp3"`

## Success Criteria

1. ZOE can run `probe agent voice "message" --audioUrl "https://audio.zenon.red/..."` and continue immediately
2. Audio plays automatically on `zoe.zenon.red` when browser policy permits, and shows a clear one-tap enable flow when blocked
3. Failed generations return an error to probe — no silent failures
4. Frontend playback uses local recency policy and does not depend on global STDB playback status
5. No external backend services required beyond self-hosted STDB
6. Total cost stays under $20/month during testing
