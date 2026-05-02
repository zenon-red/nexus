import {
  memo,
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
  useTransition,
  useReducer,
} from "react";
import { useNavigate, Link } from "react-router";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  useMessages,
  useProjectMessages,
  useVotes,
  useTasks,
  useIdeas,
  useAgents,
  useProjects,
  useChannels,
  useVoiceAnnouncements,
  AnnouncementStatusEnum,
  VoteTypeEnum,
  TaskStatusEnum,
  mapAgentsById,
  mapProjectNamesById,
  mapChannelNamesById,
} from "@/spacetime/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  MessageSquare,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Lightbulb,
  CircleDot,
  GitPullRequest,
  FolderOpen,
  Play,
  Pause,
} from "lucide-react";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";

const TOP_STICKY_THRESHOLD = 80;
const BOTTOM_LOAD_THRESHOLD = 600;
const ROW_ESTIMATE = 76;
const INITIAL_VIEWPORT_MULTIPLIER = 2;

type FeedWindowState = {
  visibleCount: number;
  headOffset: number;
  pendingNewCount: number;
  isNearTop: boolean;
  isInitialBatchReady: boolean;
};

type FeedWindowAction =
  | { type: "resetEmpty" }
  | { type: "setInitialVisibleCount"; count: number }
  | { type: "setInitialBatchReady" }
  | { type: "clampVisibleCount"; total: number }
  | { type: "clampHeadOffset"; total: number }
  | { type: "prependWhileScrolled"; count: number }
  | { type: "setNearTop"; value: boolean }
  | { type: "jumpToLatest" }
  | { type: "loadMore"; count: number };

const initialFeedWindowState: FeedWindowState = {
  visibleCount: 0,
  headOffset: 0,
  pendingNewCount: 0,
  isNearTop: true,
  isInitialBatchReady: false,
};

function feedWindowReducer(state: FeedWindowState, action: FeedWindowAction): FeedWindowState {
  switch (action.type) {
    case "resetEmpty":
      return {
        ...state,
        visibleCount: 0,
        headOffset: 0,
        pendingNewCount: 0,
        isInitialBatchReady: false,
      };
    case "setInitialVisibleCount":
      return { ...state, visibleCount: action.count };
    case "setInitialBatchReady":
      return { ...state, isInitialBatchReady: true };
    case "clampVisibleCount":
      return { ...state, visibleCount: Math.min(state.visibleCount, action.total) };
    case "clampHeadOffset":
      return { ...state, headOffset: Math.min(state.headOffset, action.total) };
    case "prependWhileScrolled":
      return {
        ...state,
        headOffset: state.headOffset + action.count,
        pendingNewCount: state.pendingNewCount + action.count,
      };
    case "setNearTop":
      return action.value
        ? { ...state, isNearTop: true, headOffset: 0, pendingNewCount: 0 }
        : { ...state, isNearTop: false };
    case "jumpToLatest":
      return { ...state, headOffset: 0, pendingNewCount: 0, isNearTop: true };
    case "loadMore":
      return { ...state, visibleCount: action.count };
  }
}

type ActivityEvent = {
  id: string;
  type: "message" | "project_message" | "vote" | "task" | "idea" | "voice_announcement";
  isDirective?: boolean;
  timestamp: number;
  title: string;
  subtitle: string;
  actor?: string;
  actorName?: string;
  channelName?: string;
  projectName?: string;
  projectId?: bigint;
  linkPath?: string;
  actorIdentity?: string;
  contextId?: string;
  githubIssueUrl?: string;
  githubPrUrl?: string;
  entityId?: string;
  entityType?: "idea" | "task";
  statusColor?: string;
  audioUrl?: string;
};

function formatTimeAgo(micros: bigint): string {
  const seconds = Number(micros / 1000000n);
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  onLastActivityChange?: (timestamp: number | null) => void;
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-border/10 px-4 py-3">
          <div className="h-4 w-4 rounded-full bg-muted/50" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-muted/50" />
            <div className="h-2.5 w-1/3 rounded bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

const eventIcons = {
  message: MessageSquare,
  project_message: MessageSquare,
  vote_up: ArrowUp,
  vote_down: ArrowDown,
  task: CheckCircle,
  idea: Lightbulb,
  voice_announcement: MessageSquare,
};

const eventColors = {
  message: "text-primary",
  project_message: "text-purple-400",
  vote_up: "text-success",
  vote_down: "text-destructive",
  task: "text-accent",
  idea: "text-warning",
  voice_announcement: "text-primary",
};

function getIdeaStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Voting: "text-warning",
    Approved: "text-success",
    ApprovedForProject: "text-success",
    Rejected: "text-destructive",
    Implemented: "text-accent",
  };
  return colors[status] || "text-muted-foreground";
}

interface EventRowProps {
  event: ActivityEvent;
  shouldAnimate: boolean;
  isVoicePlaying: boolean;
  onToggleVoice: (event: ActivityEvent) => void;
}

const EventRow = memo(function EventRow({
  event,
  shouldAnimate,
  isVoicePlaying,
  onToggleVoice,
}: EventRowProps) {
  const navigate = useNavigate();

  const iconKey =
    event.type === "vote"
      ? event.title.toLowerCase().includes("up")
        ? "vote_up"
        : "vote_down"
      : event.type;
  const Icon = eventIcons[iconKey] || MessageSquare;
  const colorClass = eventColors[iconKey] || eventColors.message;

  const navigateToEventLink = () => {
    if (event.linkPath) {
      navigate(event.linkPath);
    }
  };

  const hasActor = event.actor && event.actorIdentity;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldAnimate ? { duration: 0.16, ease: "easeOut" } : { duration: 0 }}
      onClick={navigateToEventLink}
      className={cn(
        "flex items-center gap-3 border-b border-border/10 px-4 py-3 transition-colors hover:border-border/20 hover:bg-white/2",
        event.linkPath && "cursor-pointer",
      )}
    >
      <div className="flex h-full w-6 items-center justify-center">
        {event.type === "voice_announcement" ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVoice(event);
            }}
            className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border bg-surface-elevated transition-colors hover:border-primary/50 hover:bg-surface-overlay"
            title={isVoicePlaying ? "Pause announcement" : "Play announcement"}
          >
            {isVoicePlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        ) : (
          <Icon className={cn("size-4 shrink-0", colorClass)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm text-foreground/90">{event.title}</p>
        <div className="mt-1.5 flex items-center gap-3">
          {event.subtitle && event.type !== "idea" && (
            <span className="text-tiny text-muted-foreground">{event.subtitle}</span>
          )}
          {event.isDirective && (
            <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
              Directive
            </span>
          )}
          {event.type === "idea" && event.subtitle && (
            <span
              className={`text-tiny font-semibold tracking-wider ${event.statusColor || "text-muted-foreground"}`}
            >
              [{event.subtitle.toUpperCase()}]
            </span>
          )}
          {event.entityType === "task" && event.entityId && (
            <div className="flex items-center gap-1 text-tiny text-accent">
              <CheckCircle className="size-3" />
              <span>Task #{event.entityId}</span>
            </div>
          )}
          {event.entityType === "idea" && event.entityId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/ideas/${event.entityId}`);
              }}
              className="flex cursor-pointer items-center gap-1 text-tiny text-warning underline decoration-warning/40 underline-offset-2 transition-colors hover:text-amber-400 hover:decoration-amber-400"
            >
              <Lightbulb className="size-3" />
              <span>Idea #{event.entityId}</span>
            </button>
          )}
          {event.contextId && event.contextId.match(/^task:(\d+)$/i) && (
            <div className="flex items-center gap-1 text-tiny text-accent">
              <CheckCircle className="size-3" />
              <span>Task #{event.contextId.match(/^task:(\d+)$/i)?.[1]}</span>
            </div>
          )}
          {event.contextId && !event.contextId.match(/^(task|idea):\d+$/i) && (
            <span className="max-w-[100px] truncate text-tiny text-muted-foreground/60">
              {event.contextId}
            </span>
          )}
          {event.projectName && event.projectId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${event.projectId}`);
              }}
              className="flex cursor-pointer items-center gap-1 text-tiny text-success underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-400 hover:decoration-emerald-400"
            >
              <FolderOpen className="size-3" />
              <span className="max-w-[120px] truncate">{event.projectName}</span>
            </button>
          )}

          {hasActor && (
            <div className="flex items-center gap-1.5">
              {event.type === "message" && event.channelName && (
                <span className="text-tiny text-muted-foreground">#{event.channelName}</span>
              )}
              <Link
                to={`/agents/${event.actor}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 hover:underline"
              >
                <AlienAvatar seed={event.actorIdentity!} size={14} />
                <span className="text-tiny text-muted-foreground">
                  @{event.actor?.toLowerCase().slice(0, 6)}
                </span>
              </Link>
            </div>
          )}
          {(event.githubIssueUrl || event.githubPrUrl) && (
            <div className="flex items-center gap-2">
              {event.githubIssueUrl && (
                <a
                  href={event.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-tiny text-purple-500 underline decoration-purple-500/40 underline-offset-2 transition-colors hover:text-purple-400 hover:decoration-purple-400"
                  aria-label="Open GitHub issue"
                >
                  <CircleDot className="size-3" />
                  <span>Issue</span>
                </a>
              )}
              {event.githubPrUrl && (
                <a
                  href={event.githubPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-tiny text-emerald-500 underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-400 hover:decoration-emerald-400"
                  aria-label="Open GitHub pull request"
                >
                  <GitPullRequest className="size-3" />
                  <span>PR</span>
                </a>
              )}
            </div>
          )}

          <span className="ml-auto text-tiny text-muted-foreground/60">
            {formatTimeAgo(BigInt(event.timestamp))}
          </span>
        </div>
      </div>
    </m.div>
  );
});

export function ActivityFeed({
  className,
  maxItems = 50,
  onLastActivityChange,
}: ActivityFeedProps) {
  const messages = useMessages();
  const projectMessages = useProjectMessages();
  const votes = useVotes();
  const tasks = useTasks();
  const ideas = useIdeas();
  const agents = useAgents();
  const projects = useProjects();
  const channels = useChannels();
  const announcements = useVoiceAnnouncements();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevTopEventIdRef = useRef<string | null>(null);
  const animatedEventIdsRef = useRef<Set<string>>(new Set());
  const didInitialAutofillRef = useRef(false);
  const [windowState, dispatchWindow] = useReducer(feedWindowReducer, initialFeedWindowState);
  const { visibleCount, headOffset, pendingNewCount, isNearTop, isInitialBatchReady } = windowState;
  const [isPending, startTransition] = useTransition();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleToggleVoice = useCallback(
    (event: ActivityEvent) => {
      if (event.type !== "voice_announcement" || !event.audioUrl) return;

      if (playingVoiceId === event.id) {
        audioRef.current?.pause();
        audioRef.current = null;
        setPlayingVoiceId(null);
        return;
      }

      audioRef.current?.pause();
      const audio = new Audio(event.audioUrl);
      audioRef.current = audio;
      setPlayingVoiceId(event.id);

      audio.onended = () => {
        setPlayingVoiceId((current) => (current === event.id ? null : current));
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingVoiceId((current) => (current === event.id ? null : current));
        if (audioRef.current === audio) audioRef.current = null;
      };

      void audio.play().catch(() => {
        setPlayingVoiceId((current) => (current === event.id ? null : current));
        if (audioRef.current === audio) audioRef.current = null;
      });
    },
    [playingVoiceId],
  );

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const agentNames = useMemo(() => {
    const byId = mapAgentsById(agents);
    const names: Record<string, string> = {};
    for (const [id, agent] of byId) {
      names[id] = agent.name;
    }
    return names;
  }, [agents]);

  const agentAvatarSeeds = useMemo(() => {
    const byId = mapAgentsById(agents);
    const seeds: Record<string, string> = {};
    for (const [id, agent] of byId) {
      seeds[id] = agent.zenonAddress || agent.identity.toHexString();
    }
    return seeds;
  }, [agents]);

  const projectNames = useMemo(() => {
    return mapProjectNamesById(projects);
  }, [projects]);

  const channelNames = useMemo(() => {
    return mapChannelNamesById(channels);
  }, [channels]);

  const allEvents = useMemo(() => {
    const messageEvents = messages.map(
      (msg): ActivityEvent => ({
        id: `msg-${msg.id}`,
        type: "message",
        isDirective: msg.messageType.tag === "Directive",
        timestamp: Number(msg.createdAt.microsSinceUnixEpoch),
        title: msg.content.slice(0, 80) + (msg.content.length > 80 ? "..." : ""),
        subtitle: "",
        actor: msg.senderId,
        actorName: agentNames[msg.senderId],
        actorIdentity: agentAvatarSeeds[msg.senderId] || msg.senderId,
        channelName: channelNames[msg.channelId.toString()],
        contextId: msg.contextId || undefined,
      }),
    );

    const projectMessageEvents = projectMessages.map(
      (msg): ActivityEvent => ({
        id: `pmsg-${msg.id}`,
        type: "project_message",
        isDirective: msg.messageType.tag === "Directive",
        timestamp: Number(msg.createdAt.microsSinceUnixEpoch),
        title: msg.content.slice(0, 80) + (msg.content.length > 80 ? "..." : ""),
        subtitle: "",
        actor: msg.senderId,
        actorName: agentNames[msg.senderId],
        actorIdentity: agentAvatarSeeds[msg.senderId] || msg.senderId,
        projectName: projectNames[msg.projectId.toString()],
        projectId: msg.projectId,
        linkPath: `/projects/${msg.projectId}`,
        contextId: msg.contextId || undefined,
      }),
    );

    const voteEvents = votes.map(
      (vote): ActivityEvent => ({
        id: `vote-${vote.id}`,
        type: "vote",
        timestamp: Number(vote.createdAt.microsSinceUnixEpoch),
        title: `voted ${VoteTypeEnum.display(vote.voteType)}`,
        subtitle: "",
        actor: vote.agentId,
        actorName: agentNames[vote.agentId],
        actorIdentity: agentAvatarSeeds[vote.agentId] || vote.agentId,
        linkPath: `/ideas/${vote.ideaId}`,
        entityType: "idea",
        entityId: vote.ideaId.toString(),
      }),
    );

    const taskEvents = tasks.map(
      (task): ActivityEvent => ({
        id: `task-${task.id}`,
        type: "task",
        timestamp: Number(task.updatedAt.microsSinceUnixEpoch),
        title: task.title,
        subtitle: TaskStatusEnum.display(task.status),
        actor: task.assignedTo || undefined,
        actorName: task.assignedTo ? agentNames[task.assignedTo] : undefined,
        actorIdentity: task.assignedTo
          ? agentAvatarSeeds[task.assignedTo] || task.assignedTo
          : undefined,
        projectName: projectNames[task.projectId.toString()],
        projectId: task.projectId,
        linkPath: `/projects/${task.projectId}`,
        githubIssueUrl: task.githubIssueUrl || undefined,
        githubPrUrl: task.githubPrUrl || undefined,
        entityType: "task",
        entityId: task.id.toString(),
      }),
    );

    const ideaEvents = ideas.map(
      (idea): ActivityEvent => ({
        id: `idea-${idea.id}`,
        type: "idea",
        timestamp: Number(idea.updatedAt.microsSinceUnixEpoch),
        title: idea.title,
        subtitle: idea.status.tag === "ApprovedForProject" ? "Approved" : idea.status.tag,
        actor: idea.createdBy,
        actorName: agentNames[idea.createdBy],
        actorIdentity: agentAvatarSeeds[idea.createdBy] || idea.createdBy,
        linkPath: `/ideas/${idea.id}`,
        entityType: "idea",
        entityId: idea.id.toString(),
        statusColor: getIdeaStatusColor(idea.status.tag),
      }),
    );

    const voiceEvents: ActivityEvent[] = [];
    for (const announcement of announcements) {
      if (!AnnouncementStatusEnum.is.ready(announcement.status) || !announcement.audioUrl) {
        continue;
      }

      voiceEvents.push({
        id: `voice-${announcement.id}`,
        type: "voice_announcement",
        timestamp: Number(announcement.createdAt.microsSinceUnixEpoch),
        title:
          announcement.transcript.slice(0, 100) +
          (announcement.transcript.length > 100 ? "..." : ""),
        subtitle: `Voice #${announcement.seq.toString()}`,
        actorName: announcement.agentName,
        audioUrl: announcement.audioUrl,
      });
    }

    const allEvents = [
      ...messageEvents,
      ...projectMessageEvents,
      ...voteEvents,
      ...taskEvents,
      ...ideaEvents,
      ...voiceEvents,
    ];
    allEvents.sort((a, b) => b.timestamp - a.timestamp);
    return allEvents;
  }, [
    messages,
    projectMessages,
    votes,
    tasks,
    ideas,
    agentNames,
    agentAvatarSeeds,
    projectNames,
    channelNames,
    announcements,
  ]);

  useEffect(() => {
    if (allEvents.length === 0) {
      dispatchWindow({ type: "resetEmpty" });
      didInitialAutofillRef.current = false;
      return;
    }

    if (!isInitialBatchReady) {
      const viewportHeight = containerRef.current?.clientHeight || ROW_ESTIMATE * 10;
      const rowsPerViewport = Math.max(1, Math.ceil(viewportHeight / ROW_ESTIMATE));
      const initialCount = Math.min(
        allEvents.length,
        Math.max(maxItems, rowsPerViewport * INITIAL_VIEWPORT_MULTIPLIER),
      );

      dispatchWindow({ type: "setInitialVisibleCount", count: initialCount });
      const rafId = requestAnimationFrame(() => {
        dispatchWindow({ type: "setInitialBatchReady" });
      });
      return () => cancelAnimationFrame(rafId);
    }

    dispatchWindow({ type: "clampVisibleCount", total: allEvents.length });
  }, [allEvents.length, isInitialBatchReady, maxItems]);

  useEffect(() => {
    dispatchWindow({ type: "clampHeadOffset", total: allEvents.length });
  }, [allEvents.length]);

  useEffect(() => {
    const currentTopId = allEvents[0]?.id ?? null;
    const prevTopId = prevTopEventIdRef.current;

    if (prevTopId && currentTopId && prevTopId !== currentTopId) {
      const prependCount = allEvents.findIndex((event) => event.id === prevTopId);
      if (prependCount > 0 && !isNearTop) {
        dispatchWindow({ type: "prependWhileScrolled", count: prependCount });
      }
    }

    prevTopEventIdRef.current = currentTopId;
  }, [allEvents, isNearTop]);

  const events = useMemo(() => {
    return allEvents.slice(headOffset, headOffset + visibleCount);
  }, [allEvents, headOffset, visibleCount]);

  const hasMore = headOffset + visibleCount < allEvents.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isPending) return;

    startTransition(() => {
      dispatchWindow({
        type: "loadMore",
        count: Math.min(visibleCount + maxItems, allEvents.length),
      });
    });
  }, [allEvents.length, hasMore, isPending, maxItems, startTransition, visibleCount]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const nearTop = el.scrollTop <= TOP_STICKY_THRESHOLD;
    if (nearTop !== isNearTop) {
      dispatchWindow({ type: "setNearTop", value: nearTop });
    }

    if (!hasMore || isPending) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < BOTTOM_LOAD_THRESHOLD) {
      loadMore();
    }
  }, [hasMore, isPending, isNearTop, loadMore]);

  const handleJumpToLatest = useCallback(() => {
    dispatchWindow({ type: "jumpToLatest" });
    const el = containerRef.current;
    if (el) {
      el.scrollTop = 0;
      requestAnimationFrame(() => {
        const node = containerRef.current;
        if (node) {
          node.scrollTop = 0;
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!isInitialBatchReady || didInitialAutofillRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    didInitialAutofillRef.current = true;
    if (hasMore && el.scrollHeight <= el.clientHeight + ROW_ESTIMATE) {
      loadMore();
    }
  }, [hasMore, isInitialBatchReady, loadMore]);

  useEffect(() => {
    onLastActivityChange?.(allEvents.length > 0 ? allEvents[0].timestamp : null);
  }, [allEvents, onLastActivityChange]);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 5,
    getItemKey: (index) => events[index]?.id ?? index,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
      <div
        className={cn(
          "relative h-full min-h-0 flex-1 overflow-hidden rounded-lg border border-border/50 bg-surface",
        )}
      >
        {pendingNewCount > 0 && !isNearTop && (
          <button
            type="button"
            onClick={handleJumpToLatest}
            className="absolute top-3 right-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border bg-surface-elevated transition-all hover:border-primary/50 hover:bg-surface-overlay"
            aria-label="Jump to latest events"
          >
            <ArrowUp className="h-4 w-4 text-foreground" />
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] leading-4 font-semibold text-destructive-foreground">
              {pendingNewCount > 99 ? "99+" : pendingNewCount}
            </span>
          </button>
        )}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent h-full min-h-0 overflow-y-auto"
        >
          {!isInitialBatchReady && allEvents.length > 0 ? (
            <ActivityFeedSkeleton />
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualItem) => {
                const event = events[virtualItem.index];
                if (!event) return null;
                const shouldAnimate =
                  !prefersReducedMotion && !animatedEventIdsRef.current.has(event.id);
                if (shouldAnimate) {
                  animatedEventIdsRef.current.add(event.id);
                }

                return (
                  <div
                    key={event.id}
                    data-index={virtualItem.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <EventRow
                      event={event}
                      shouldAnimate={shouldAnimate}
                      isVoicePlaying={playingVoiceId === event.id}
                      onToggleVoice={handleToggleVoice}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {isPending && events.length > 0 && (
            <div className="border-t border-border/10 px-4 py-3 text-tiny text-muted-foreground">
              Loading more activity...
            </div>
          )}

          {!hasMore && events.length > 0 && (
            <div className="border-t border-border/10 px-4 py-3 text-tiny text-muted-foreground">
              Showing all {allEvents.length} activity events.
            </div>
          )}

          {events.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
