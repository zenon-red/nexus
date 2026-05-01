import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceAnnouncements, AnnouncementStatusEnum } from "@/spacetime/hooks";
import type { VoiceAnnouncement } from "@/spacetime/generated/types";

const PLAYED_STORAGE_KEY = "nexus.voice.played";
const AUTPLAY_BLOCKED_KEY = "nexus.voice.autoplay_blocked";
const ALLOWED_AUDIO_HOST = "audio.zenon.red";
const PLAYBACK_DELAY_MS = 2000;

function loadAutoplayBlocked(): boolean {
  try {
    return window.sessionStorage.getItem(AUTPLAY_BLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistAutoplayBlocked(value: boolean) {
  try {
    if (value) {
      window.sessionStorage.setItem(AUTPLAY_BLOCKED_KEY, "1");
    } else {
      window.sessionStorage.removeItem(AUTPLAY_BLOCKED_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

function announcementKey(a: VoiceAnnouncement): string {
  return `${a.agentName}:${a.id.toString()}`;
}

export interface VoiceAnnouncerState {
  isPlaying: boolean;
  autoplayBlocked: boolean;
  enableVoice: () => Promise<void>;
  pauseVoice: () => void;
  hasNextAnnouncement: boolean;
  levels: number[];
}

interface VoiceAnnouncerProps {
  onStateChange?: (state: VoiceAnnouncerState) => void;
  onLevelsChange?: (levels: number[]) => void;
}

const EMPTY_LEVELS = Array(12).fill(0) as number[];

function loadPlayedSet(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(PLAYED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function persistPlayedSet(values: Set<string>) {
  try {
    window.sessionStorage.setItem(PLAYED_STORAGE_KEY, JSON.stringify([...values]));
  } catch {
    // ignore storage failures
  }
}

function getTimestampMillis(ts: { microsSinceUnixEpoch: bigint }): number {
  return Number(ts.microsSinceUnixEpoch / 1000n);
}

function isAllowedAudioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === ALLOWED_AUDIO_HOST;
  } catch {
    return false;
  }
}

export function VoiceAnnouncer({
  onStateChange,
  onLevelsChange,
}: VoiceAnnouncerProps) {
  const announcements = useVoiceAnnouncements();
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(loadAutoplayBlocked);
  const [canAutoPlay, setCanAutoPlay] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef<Set<string>>(new Set());
  const currentAnnouncementRef = useRef<VoiceAnnouncement | null>(null);
  const rafRef = useRef<number | null>(null);
  const levelsRef = useRef<number[]>(EMPTY_LEVELS);
  const autoPlayTimeoutRef = useRef<number | null>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    playedRef.current = loadPlayedSet();
  }, []);

  useEffect(() => {
    persistAutoplayBlocked(autoplayBlocked);
  }, [autoplayBlocked]);

  const now = Date.now();
  const RECENT_CUTOFF_MS = 6 * 60 * 60 * 1000;
  const FALLBACK_CUTOFF_MS = 6 * 60 * 60 * 1000;

  const eligibleAnnouncements = announcements
    .filter(
      (a) =>
        a.agentName === "zoe" &&
        AnnouncementStatusEnum.is.ready(a.status) &&
        isAllowedAudioUrl(a.audioUrl) &&
        !playedRef.current.has(announcementKey(a)),
    )
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));

  const fresh = eligibleAnnouncements.find(
    (a) => now - getTimestampMillis(a.createdAt) <= RECENT_CUTOFF_MS,
  );
  const fallback = eligibleAnnouncements.find(
    (a) => now - getTimestampMillis(a.createdAt) <= FALLBACK_CUTOFF_MS,
  );
  const nextAnnouncement = fresh ?? fallback ?? null;

  const clearAutoPlayTimeout = useCallback(() => {
    if (autoPlayTimeoutRef.current !== null) {
      window.clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    clearAutoPlayTimeout();
    isPendingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    levelsRef.current = EMPTY_LEVELS;
    onLevelsChange?.(EMPTY_LEVELS);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    currentAnnouncementRef.current = null;
  }, [onLevelsChange, clearAutoPlayTimeout]);

  const scheduleNextAutoPlay = useCallback(() => {
    clearAutoPlayTimeout();
    setCanAutoPlay(false);
    autoPlayTimeoutRef.current = window.setTimeout(() => {
      setCanAutoPlay(true);
    }, PLAYBACK_DELAY_MS);
  }, [clearAutoPlayTimeout]);

  const playAnnouncement = useCallback(
    async (announcement: VoiceAnnouncement) => {
      if (isPendingRef.current) return;

      cleanupAudio();
      isPendingRef.current = true;
      currentAnnouncementRef.current = announcement;

      audioRef.current = new Audio(announcement.audioUrl);
      audioRef.current.volume = 0.8;

      const tickLevels = () => {
        const audio = audioRef.current;
        if (!audio || audio.paused || audio.ended) return;
        const columns = 12;
        const time = audio.currentTime * 8;
        const nextLevels = Array.from({ length: columns }, (_, i) => {
          const wave = Math.sin(time + i * 0.75) * 0.5 + 0.5;
          const pulse = Math.sin(time * 0.45 + i * 0.25) * 0.5 + 0.5;
          return Math.max(0.08, Math.min(1, wave * 0.7 + pulse * 0.3));
        });
        levelsRef.current = nextLevels;
        onLevelsChange?.(nextLevels);
        rafRef.current = requestAnimationFrame(tickLevels);
      };

      audioRef.current.onended = () => {
        // Only mark as played on successful completion
        playedRef.current.add(announcementKey(announcement));
        persistPlayedSet(playedRef.current);
        setIsPlaying(false);
        isPendingRef.current = false;
        cleanupAudio();
        scheduleNextAutoPlay();
      };

      audioRef.current.onerror = () => {
        console.error("Audio playback failed for announcement", announcement.id.toString());
        // Clear played marker so transient failures can retry
        playedRef.current.delete(announcementKey(announcement));
        persistPlayedSet(playedRef.current);
        setIsPlaying(false);
        isPendingRef.current = false;
        setCanAutoPlay(false);
        cleanupAudio();
      };

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        tickLevels();
      } catch {
        // Autoplay blocked by browser policy — don't mark as played
        isPendingRef.current = false;
        setAutoplayBlocked(true);
        cleanupAudio();
      }
    },
    [cleanupAudio, onLevelsChange, scheduleNextAutoPlay],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Auto-play next eligible announcement
  useEffect(() => {
    if (isPlaying || !nextAnnouncement || autoplayBlocked || !canAutoPlay) return;
    playAnnouncement(nextAnnouncement);
  }, [nextAnnouncement, isPlaying, autoplayBlocked, canAutoPlay, playAnnouncement]);

  const handleEnableVoice = useCallback(async () => {
    clearAutoPlayTimeout();
    isPendingRef.current = false;
    setAutoplayBlocked(false);
    setCanAutoPlay(true);
    if (nextAnnouncement) {
      await playAnnouncement(nextAnnouncement);
    }
  }, [nextAnnouncement, playAnnouncement, clearAutoPlayTimeout]);

  const handlePauseVoice = useCallback(() => {
    clearAutoPlayTimeout();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    isPendingRef.current = false;
    setCanAutoPlay(false);
    cleanupAudio();
  }, [cleanupAudio, clearAutoPlayTimeout]);

  useEffect(() => {
    onStateChange?.({
      isPlaying,
      autoplayBlocked,
      enableVoice: handleEnableVoice,
      pauseVoice: handlePauseVoice,
      hasNextAnnouncement: !!nextAnnouncement,
      levels: levelsRef.current,
    });
  }, [isPlaying, autoplayBlocked, onStateChange, handleEnableVoice, handlePauseVoice, nextAnnouncement]);

  return null;
}
