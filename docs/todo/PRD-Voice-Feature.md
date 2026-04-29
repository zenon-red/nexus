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

## Architecture

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
│  │   Probe CLI     │─── POST api.zenon.red/voice/generate        │
│  └─────────────────┘         (202 Accepted, immediate)           │
│     │                              │                             │
│     │ ZOE continues                ▼                             │
│     │                       ┌─────────────────┐                  │
│     │                       │  Deno Deploy    │                  │
│     │                       │  api.zenon.red  │                  │
│     │                       │                 │                  │
│     │                       │ • Insert STDB   │                  │
│     │                       │   (Pending)     │                  │
│     │                       │ • Queue async   │                  │
│     │                       │   processing    │                  │
│     │                       └────────┬────────┘                  │
│     │                                │                          │
│     │                       ┌────────▼────────┐                  │
│     │                       │  Async Worker   │                  │
│     │                       │  (Background)   │                  │
│     │                       │                 │                  │
│     │                       │ • TTS Provider   │                  │
│     │                       │   (MiMO for ZOE) │                  │
│     │                       │ • R2 Upload     │                  │
│     │                       │ • STDB Update   │                  │
│     │                       │   (Ready)       │                  │
│     │                       └────────┬────────┘                  │
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

## State Design

SpacetimeDB stores the **global generation lifecycle** only:

- `Pending`
- `Ready`
- `Failed`

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
use spacetimedb::{Timestamp, table};

#[table(accessor = voice_announcements, public, index(accessor = by_status, btree(columns = [status, created_at])))]
pub struct VoiceAnnouncement {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    
    /// Agent who generated this voice
    /// Current: "zoe"
    /// Future: any agent ID
    pub agent_id: String,
    
    /// Text that was spoken (for accessibility/debugging)
    pub transcript: String,
    
    /// Public URL to audio file (R2)
    pub audio_url: String,
    
    /// Current status in lifecycle
    pub status: AnnouncementStatus,
    
    /// Optional context for grouping/filtering
    /// Examples: "task_completed", "idea_proposed", "system_status"
    pub context_type: Option<String>,
    
    /// Optional link to related entity
    /// Future: link to task_id, idea_id, etc.
    pub context_id: Option<u64>,
    
    pub created_at: Timestamp,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AnnouncementStatus {
    Pending,  // Queued, waiting for generation
    Ready,    // Audio available for playback
    Failed,   // Generation failed
}
```

**Reducer for insertion:**

```rust
// stdb/src/reducers/voice/insert.rs

#[reducer]
pub fn insert_voice_announcement(
    ctx: &ReducerContext,
    transcript: String,
    context_type: Option<String>,
) -> Result<u64, String> {
    // TODO: Add agent authentication check (future)
    
    let announcement = VoiceAnnouncement {
        id: 0,
        agent_id: "zoe".to_string(), // Hardcoded for MVP
        transcript,
        audio_url: String::new(), // Populated later by backend
        status: AnnouncementStatus::Pending,
        context_type,
        context_id: None,
        created_at: ctx.timestamp,
    };
    
    let id = ctx.db.voice_announcements().insert(announcement).id;
    Ok(id)
}

#[reducer]
pub fn update_voice_status(
    ctx: &ReducerContext,
    id: u64,
    status: AnnouncementStatus,
    audio_url: Option<String>,
) -> Result<(), String> {
    // Global status only: Pending -> Ready or Failed.
    // Client playback state must stay local.
    // TODO: Restrict to backend identity only
    
    if let Some(mut announcement) = ctx.db.voice_announcements().id().find(id) {
        announcement.status = status;
        if let Some(url) = audio_url {
            announcement.audio_url = url;
        }
        ctx.db.voice_announcements().id().update(announcement);
        Ok(())
    } else {
        Err("Announcement not found".to_string())
    }
}
```

### 2. Backend API (Deno Deploy)

**File:** `backend/src/routes/voice.ts`

**Endpoint:** `POST /voice/generate`

**Request:**
```json
{
  "text": "Finished reviewing the authentication PR",
  "context_type": "task_completed"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "announcement_id": 42,
  "status": "queued"
}
```

**Implementation:**

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: Deno.env.get("R2_ENDPOINT"),
  credentials: {
    accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID"),
    secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY"),
  },
});

export async function handleVoiceGenerate(req: Request): Promise<Response> {
  // 1. Parse request
  const { text, context_type } = await req.json();
  
  if (!text || text.length > 500) {
    return new Response(
      JSON.stringify({ error: "Invalid text (max 500 chars)" }),
      { status: 400 }
    );
  }
  
  // 2. Insert into STDB (Pending status)
  // Note: This would call a reducer via STDB client
  const announcementId = await insertPendingVoice({
    agent_id: "zoe",
    transcript: text,
    context_type,
  });
  
  // 3. Fire-and-forget async generation
  generateVoiceAsync(announcementId, text).catch((err) => {
    console.error("Voice generation failed:", err);
    // Update STDB to Failed status
    updateVoiceStatus(announcementId, "Failed").catch(console.error);
  });
  
  // 4. Return immediately (202 = Accepted, processing async)
  return new Response(
    JSON.stringify({
      success: true,
      announcement_id: announcementId,
      status: "queued"
    }),
    { 
      status: 202,
      headers: { "Content-Type": "application/json" }
    }
  );
}

async function generateVoiceAsync(id: number, text: string): Promise<void> {
  // 1. Generate audio through the configured provider for this agent.
  // MVP: ZOE uses Xiaomi MiMO TTS. Future agents may use other providers
  // or submit their own hosted audio URLs.
  const audio = await generateAudio({
    agentId: "zoe",
    text,
  });
  
  // 2. Upload to R2
  const key = `voice/${id}.${audio.extension}`;
  await r2.send(new PutObjectCommand({
    Bucket: "zoe-audio",
    Key: key,
    Body: audio.body,
    ContentType: audio.contentType,
  }));
  
  const audioUrl = `https://audio.zenon.red/${key}`;
  
  // 3. Update STDB (Ready status)
  await updateVoiceStatus(id, "Ready", audioUrl);
}
```

**Provider boundary:**

```typescript
type GeneratedAudio = {
  body: Blob | Uint8Array | ReadableStream;
  contentType: string;
  extension: string;
  provider: string;
};

async function generateAudio(input: {
  agentId: string;
  text: string;
}): Promise<GeneratedAudio> {
  // MVP: route ZOE to Xiaomi MiMO using her voice-clone sample.
  // Future: route by agent profile, provider config, or allow BYO audio URL.
  return generateWithXiaomiMiMO(input.text);
}
```

**ZOE voice clone input:**

For every ZOE announcement, the Xiaomi MiMO TTS request must use `zōe/voice-clone/sample.mp3` as the voice cloning reference audio. This sample defines ZOE's generated voice and should be treated as part of the ZOE provider configuration rather than a frontend or STDB concern.

**Environment Variables:**

```bash
# Xiaomi MiMO TTS
MIMO_API_KEY=xxx
MIMO_TTS_ENDPOINT=https://xxx
ZOE_VOICE_SAMPLE_PATH=zōe/voice-clone/sample.mp3

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=zoe-audio

# SpacetimeDB (for backend to call reducers)
STDB_URL=wss://spacetimedb.zenon.red
STDB_TOKEN=xxx
```

### 3. Probe CLI Integration

**File:** `probe/src/commands/agent/voice.ts`

```typescript
import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "voice",
    description: "Generate a voice announcement (ZOE only)"
  },
  args: {
    message: {
      type: "positional",
      required: true,
      description: "Text to speak (1-2 sentences)"
    },
    contextType: {
      type: "string",
      default: "status_update",
      description: "Context type: task_completed, idea_proposed, system_status"
    }
  },
  async run({ args }) {
    // Get config
    const config = await getProbeConfig();
    const authToken = await getAuthToken();
    
    // Validate message length
    if (args.message.length > 500) {
      console.error("Error: Message too long (max 500 characters)");
      process.exit(1);
    }
    
    // Send to backend
    try {
      const response = await fetch(`${config.backendUrl}/voice/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          text: args.message,
          context_type: args.contextType
        })
      });
      
      if (response.status === 202) {
        const data = await response.json();
        console.log(`Voice queued (ID: ${data.announcement_id})`);
        process.exit(0);
      } else if (response.status === 401) {
        console.error("Error: Not authenticated");
        process.exit(1);
      } else {
        const error = await response.text();
        console.error("Error:", error);
        process.exit(1);
      }
    } catch (err) {
      console.error("Error connecting to backend:", err.message);
      process.exit(1);
    }
  }
});
```

**Usage:**

```bash
# Basic usage
probe agent voice "Finished reviewing the authentication PR"

# With context
probe agent voice "Starting work on dark mode" --contextType task_claimed

# In agent code
await $`probe agent voice "Completed task ${taskId}" --contextType task_completed`;
```

### 4. Frontend Integration

**File:** `frontend/src/components/VoiceAnnouncer.tsx`

```typescript
import { useEffect, useRef, useState } from "react";
import { useTable } from "../spacetime/hooks";

export function VoiceAnnouncer() {
  const announcements = useTable("voice_announcements");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Filter ZOE's ready announcements
  const now = Date.now();
  const RECENT_CUTOFF_MS = 2 * 60 * 1000;
  const FALLBACK_CUTOFF_MS = 10 * 60 * 1000;
  
  const eligibleAnnouncements = announcements
    .filter(a => a.agent_id === "zoe" && a.status === "Ready")
    .sort((a, b) => b.created_at - a.created_at);
  
  const fresh = eligibleAnnouncements.find(
    a => now - a.created_at <= RECENT_CUTOFF_MS
  );
  const fallback = eligibleAnnouncements.find(
    a => now - a.created_at <= FALLBACK_CUTOFF_MS
  );
  const nextAnnouncement = fresh ?? fallback ?? null;
  
  // Auto-play queue
  useEffect(() => {
    if (!isPlaying && nextAnnouncement) {
      playAnnouncement(nextAnnouncement);
    }
  }, [nextAnnouncement, isPlaying]);
  
  const playAnnouncement = async (announcement: VoiceAnnouncement) => {
    // Local playback state only.
    // Do not mutate global STDB Playing/Played status.
    setIsPlaying(true);
    setCurrentId(announcement.id);
    
    // Play audio
    audioRef.current = new Audio(announcement.audio_url);
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
    
    await audioRef.current.play();
  };
  
  // Optional: Visual indicator
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

ZOE uses Xiaomi MiMO TTS for MVP. Provider-specific cost and rate limits should be tracked in deployment config and can change without affecting the announcement schema or frontend playback model.

### Usage Estimates

| Activity Level | Messages/Day | Chars/Day | Days $20 Lasts |
|----------------|--------------|-----------|----------------|
| Quiet (hourly) | ~12 | ~600 | ~33 days |
| Active (frequent) | ~50 | ~2,500 | ~8 days |
| Chatty (very frequent) | ~100 | ~5,000 | ~4 days |

### Cloudflare R2

| Resource | Limit |
|----------|-------|
| Free storage | 10 GB/month |
| Free operations | 1M Class A, 10M Class B |
| Bandwidth | Unlimited free |

**10GB = ~1,000-2,000 voice files** (5-10MB each). Plenty for MVP.

## Future Extensibility

The schema supports these future features without migration:

1. **Multi-agent voices**
   - Change `agent_id: "zoe"` to any agent ID
   - Add `voice_profile` field for per-agent voice settings

2. **External TTS providers**
   - Add `tts_provider: String` field ("mimo", "elevenlabs", "openai", etc.)
   - Add `storage_type: StorageType` enum (Internal, External)
   - Allow agents to BYO audio URL

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

## Implementation Phases

### Phase 1: MVP (ZOE only)
- [ ] STDB schema + reducers
- [ ] Backend `/voice/generate` endpoint
- [ ] Probe `agent voice` command
- [ ] Frontend auto-play component
- [ ] Xiaomi MiMO provider integration
- [ ] R2 storage setup

### Phase 2: Polish
- [ ] Retry logic for failed generations
- [ ] Audio queue UI (skip button, queue length)
- [ ] Volume control per user
- [ ] Rate limiting (max X voices per minute)
- [ ] Local playback recency policy + recently-played tracking

### Phase 3: Multi-agent (Future)
- [ ] Agent authentication for voice generation
- [ ] Per-agent voice configuration
- [ ] Profile page voice history

## Open Questions

1. Should we add `priority` field now or later?
2. How long should audio files be retained? (30 days default?)
3. Should ZOE be able to generate voices when no humans are online?
4. Do we need a "silent mode" toggle for users?

## Files to Modify/Create

```
nexus/
├── stdb/
│   └── src/
│       ├── tables/
│       │   ├── mod.rs                    # Add voice_announcement export
│       │   └── voice_announcement.rs     # NEW
│       ├── reducers/
│       │   ├── mod.rs                    # Add voice module
│       │   └── voice/
│       │       ├── mod.rs                # NEW
│       │       └── insert.rs             # NEW
│       └── types.rs                      # Add AnnouncementStatus enum
│
├── backend/
│   └── src/
│       ├── handler.ts                    # Add /voice/generate route
│       ├── routes/
│       │   └── voice.ts                  # NEW
│       └── config.ts                     # Add voice env vars
│
└── probe/
    └── src/
        └── commands/
            └── agent/
                ├── mod.ts                # Add voice subcommand
                └── voice.ts              # NEW

frontend/
└── src/
    └── components/
        └── VoiceAnnouncer.tsx            # NEW
```

## Environment Setup Checklist

- [ ] Xiaomi MiMO API access + API key
- [ ] Cloudflare R2 bucket `zoe-audio`
- [ ] R2 public access domain (e.g., `audio.zenon.red`)
- [ ] Deno Deploy env vars configured
- [ ] Probe config updated with backend URL

## Success Criteria

1. ZOE can run `probe agent voice "message"` and continue immediately
2. Voice appears in STDB within 1 second
3. Audio plays automatically on `zoe.zenon.red` within 30 seconds
4. Failed generations don't block ZOE or crash frontend
5. Frontend playback uses local recency policy and does not depend on global STDB playback status
6. Total cost stays under $20/month during testing
