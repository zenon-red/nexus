import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  CircleDot,
  Compass,
  FolderOpen,
  GitPullRequest,
  Info,
  Lightbulb,
  MessageSquare,
  Play,
  Pause,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AgentProfileHeader } from "@/components/domain/AgentProfileHeader";
import { CyberProgress } from "@/components/ui/CyberProgress";
import { cn } from "@/lib/utils";
import { useAgent } from "@/hooks/useAgent";
import { AnnouncementStatusEnum, useVoiceAnnouncements } from "@/spacetime/hooks";
import { useIdeas } from "@/spacetime/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import type {
  DiscoveredTasksRow,
  IdeasRow,
  MessagesRow,
  ProjectMessagesRow,
  TasksRow,
  VotesRow,
} from "@/spacetime/hooks";
import type { VoiceAnnouncement } from "@/spacetime/generated/types";

function formatTimeAgo(micros: bigint): string {
  const seconds = Number(micros / 1000000n);
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function humanizeStatusTag(tag: string): string {
  return tag.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function getScoreColor(score: number): string {
  if (score >= 7) return "text-success";
  if (score >= 2) return "text-cyan-400";
  return "text-destructive";
}

function getScoreColorName(score: number): "success" | "cyan" | "destructive" {
  if (score >= 7) return "success";
  if (score >= 2) return "cyan";
  return "destructive";
}

type ActivityItem =
  | { kind: "task"; data: TasksRow; prefix: "Assigned" | "Created" }
  | { kind: "idea"; data: IdeasRow }
  | { kind: "vote"; data: VotesRow }
  | { kind: "message"; data: MessagesRow }
  | { kind: "project_message"; data: ProjectMessagesRow }
  | { kind: "discovery"; data: DiscoveredTasksRow; prefix: "Discovered" | "Reviewed" };

type EventIconKey =
  | "task"
  | "idea"
  | "vote_up"
  | "vote_down"
  | "vote_veto"
  | "message"
  | "project_message"
  | "discovery";

const eventIcons: Record<EventIconKey, typeof CheckCircle> = {
  task: CheckCircle,
  idea: Lightbulb,
  vote_up: ArrowUp,
  vote_down: ArrowDown,
  vote_veto: ArrowDown,
  message: MessageSquare,
  project_message: MessageSquare,
  discovery: Compass,
};

const eventColors: Record<EventIconKey, string> = {
  task: "text-accent",
  idea: "text-warning",
  vote_up: "text-success",
  vote_down: "text-cyan-400",
  vote_veto: "text-destructive",
  message: "text-primary",
  project_message: "text-purple-400",
  discovery: "text-purple-400",
};

function getIconKey(item: ActivityItem): EventIconKey {
  if (item.kind === "vote") {
    const vt = item.data.voteType.tag;
    return vt === "Up" ? "vote_up" : vt === "Down" ? "vote_down" : "vote_veto";
  }
  return item.kind;
}

function getTimestamp(item: ActivityItem): bigint {
  if (item.kind === "task" || item.kind === "idea") return item.data.updatedAt.microsSinceUnixEpoch;
  if (item.kind === "vote") return item.data.createdAt.microsSinceUnixEpoch;
  if (item.kind === "message" || item.kind === "project_message")
    return item.data.createdAt.microsSinceUnixEpoch;
  return item.data.createdAt.microsSinceUnixEpoch;
}

function buildActivity(
  assignedTasks: TasksRow[],
  createdTasks: TasksRow[],
  ideas: IdeasRow[],
  votes: VotesRow[],
  messages: MessagesRow[],
  projectMessages: ProjectMessagesRow[],
  discoveries: DiscoveredTasksRow[],
  reviewedDiscoveries: DiscoveredTasksRow[],
): ActivityItem[] {
  const all: ActivityItem[] = [
    ...assignedTasks.map((t) => ({ kind: "task" as const, data: t, prefix: "Assigned" as const })),
    ...createdTasks.map((t) => ({ kind: "task" as const, data: t, prefix: "Created" as const })),
    ...ideas.map((i) => ({ kind: "idea" as const, data: i })),
    ...votes.map((v) => ({ kind: "vote" as const, data: v })),
    ...messages.map((m) => ({ kind: "message" as const, data: m })),
    ...projectMessages.map((m) => ({ kind: "project_message" as const, data: m })),
    ...discoveries.map((d) => ({
      kind: "discovery" as const,
      data: d,
      prefix: "Discovered" as const,
    })),
    ...reviewedDiscoveries.map((d) => ({
      kind: "discovery" as const,
      data: d,
      prefix: "Reviewed" as const,
    })),
  ];
  all.sort((a, b) => Number(getTimestamp(b) - getTimestamp(a)));
  return all;
}

function ActivityFeedRow({ item }: { item: ActivityItem }) {
  const navigate = useNavigate();
  const iconKey = getIconKey(item);
  const Icon = eventIcons[iconKey];
  const colorClass = eventColors[iconKey];

  const navigateToActivityItem = () => {
    if (item.kind === "task") navigate(`/projects/${item.data.projectId.toString()}`);
    else if (item.kind === "idea") navigate(`/ideas/${item.data.id.toString()}`);
    else if (item.kind === "vote") navigate(`/ideas/${item.data.ideaId.toString()}`);
  };

  const hasLink = item.kind === "task" || item.kind === "idea" || item.kind === "vote";
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasLink || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    navigateToActivityItem();
  };

  let title = "";
  let subtitle = "";

  if (item.kind === "task") {
    title = item.data.title;
    subtitle = item.prefix;
  } else if (item.kind === "idea") {
    title = item.data.title;
  } else if (item.kind === "vote") {
    const vt = item.data.voteType.tag;
    title = `voted ${vt === "Up" ? "up" : vt === "Down" ? "down" : "veto"}`;
  } else if (item.kind === "message") {
    title = item.data.content.slice(0, 80) + (item.data.content.length > 80 ? "..." : "");
  } else if (item.kind === "project_message") {
    title = item.data.content.slice(0, 80) + (item.data.content.length > 80 ? "..." : "");
  } else {
    title = item.data.title;
    subtitle = item.prefix;
  }

  const rowClassName = cn(
    "flex items-center gap-3 border-b border-border/10 px-4 py-3 transition-colors hover:border-border/20 hover:bg-white/2",
    hasLink && "cursor-pointer",
  );

  const rowContent = (
    <>
      <div className="flex h-full w-6 items-center justify-center">
        <Icon className={cn("size-4 shrink-0", colorClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[15px] text-foreground/90">{title}</p>
        <div className="mt-1.5 flex items-center gap-3">
          {subtitle && item.kind !== "idea" && (
            <span className="text-tiny text-muted-foreground">{subtitle}</span>
          )}
          {item.kind === "idea" && (
            <>
              <span className="text-tiny font-semibold tracking-wider text-warning">
                [
                {item.data.status.tag === "ApprovedForProject"
                  ? "APPROVED"
                  : item.data.status.tag.toUpperCase()}
                ]
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/ideas/${item.data.id.toString()}`);
                }}
                className="flex cursor-pointer items-center gap-1 text-tiny text-warning underline decoration-warning/40 underline-offset-2 transition-colors hover:text-amber-400 hover:decoration-amber-400"
              >
                <Lightbulb className="size-3" />
                <span>Idea #{item.data.id.toString()}</span>
              </button>
            </>
          )}
          {item.kind === "task" && (
            <div className="flex items-center gap-1 text-tiny text-accent">
              <CheckCircle className="size-3" />
              <span>Task #{item.data.id.toString()}</span>
            </div>
          )}
          {item.kind === "vote" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/ideas/${item.data.ideaId.toString()}`);
              }}
              className="flex cursor-pointer items-center gap-1 text-tiny text-warning underline decoration-warning/40 underline-offset-2 transition-colors hover:text-amber-400 hover:decoration-amber-400"
            >
              <Lightbulb className="size-3" />
              <span>Idea #{item.data.ideaId.toString()}</span>
            </button>
          )}
          {item.kind === "message" && (
            <span className="text-tiny text-muted-foreground">
              #{item.data.channelId.toString()}
            </span>
          )}
          {item.kind === "project_message" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${item.data.projectId}`);
              }}
              className="flex cursor-pointer items-center gap-1 text-tiny text-success underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-400 hover:decoration-emerald-400"
            >
              <FolderOpen className="size-3" />
              <span>Project #{item.data.projectId.toString()}</span>
            </button>
          )}
          {item.kind === "discovery" && (
            <span className="text-tiny text-muted-foreground/60">
              {humanizeStatusTag(item.data.status.tag)}
            </span>
          )}
          <span className="ml-auto text-tiny text-muted-foreground/60 tabular-nums">
            {formatTimeAgo(getTimestamp(item))}
          </span>
        </div>
      </div>
    </>
  );

  if (hasLink) {
    return (
      <div
        onClick={navigateToActivityItem}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={rowClassName}
      >
        {rowContent}
      </div>
    );
  }

  return <div className={rowClassName}>{rowContent}</div>;
}

function VoteScoreTooltip({ scores }: { scores: { dimension: string; score: number }[] }) {
  if (scores.length === 0) return null;
  const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  return (
    <Tooltip side="top">
      <TooltipTrigger asChild>
        <button className="flex w-12 shrink-0 cursor-default items-center justify-center gap-1">
          <span className={cn("text-sm font-bold tabular-nums", getScoreColor(avg))}>
            {avg.toFixed(1)}
          </span>
          <Info className="size-3 text-muted-foreground/50" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="rounded-lg border border-border bg-surface px-4 py-3 shadow-xl">
        <div className="min-w-56 space-y-2">
          <div className="pb-1 text-center font-mono text-xs tracking-normal text-muted-foreground uppercase">
            Dimension scores
          </div>
          {scores.map((s) => (
            <div key={s.dimension} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{s.dimension}</span>
                <span className={cn("font-mono text-sm font-bold", getScoreColor(s.score))}>
                  {s.score}
                </span>
              </div>
              <CyberProgress
                value={s.score}
                max={10}
                color={getScoreColorName(s.score)}
                size="sm"
                showPercentage={false}
                showLabels={false}
              />
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function IdeaListRow({ idea }: { idea: IdeasRow }) {
  return (
    <Link
      to={`/ideas/${idea.id.toString()}`}
      className="group flex items-center gap-3 border-b border-border/10 px-4 py-3 transition-colors hover:bg-white/2"
    >
      <div className="flex h-full w-6 items-center justify-center">
        <Lightbulb className="size-4 shrink-0 text-warning" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[15px] text-foreground/90">{idea.title}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-tiny font-semibold tracking-wider text-warning">
            [{idea.status.tag === "ApprovedForProject" ? "APPROVED" : idea.status.tag.toUpperCase()}
            ]
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex cursor-pointer items-center gap-1 text-tiny text-warning underline decoration-warning/40 underline-offset-2 transition-colors hover:text-amber-400 hover:decoration-amber-400"
          >
            <Lightbulb className="size-3" />
            <span>Idea #{idea.id.toString()}</span>
          </button>
          <span className="ml-auto text-tiny text-muted-foreground/60 tabular-nums">
            {formatTimeAgo(idea.updatedAt.microsSinceUnixEpoch)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TaskRow({ task }: { task: TasksRow }) {
  const statusStyle: Record<string, string> = {
    Open: "text-muted-foreground",
    Claimed: "text-info",
    InProgress: "text-warning",
    Review: "text-accent",
    Completed: "text-success",
    Blocked: "text-destructive",
  };
  const statusLabel: Record<string, string> = {
    Open: "OPEN",
    Claimed: "CLAIMED",
    InProgress: "IN PROGRESS",
    Review: "REVIEW",
    Completed: "COMPLETED",
    Blocked: "BLOCKED",
  };
  const tag = task.status.tag;

  return (
    <Link
      to={`/projects/${task.projectId.toString()}`}
      className="group flex items-center gap-3 border-b border-border/10 px-4 py-3 transition-colors hover:bg-white/2"
    >
      <div className="flex h-full w-6 items-center justify-center">
        <CheckCircle className="size-4 shrink-0 text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[15px] text-foreground/90">{task.title}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span
            className={cn("text-label font-semibold", statusStyle[tag] ?? "text-muted-foreground")}
          >
            {statusLabel[tag] ?? humanizeStatusTag(tag).toUpperCase()}
          </span>
          <span className="text-label text-muted-foreground">P{task.priority}</span>
          <span className="text-label text-muted-foreground">R{task.reviewCount}</span>
          {(task.githubIssueUrl || task.githubPrUrl) && (
            <div className="flex items-center gap-2">
              {task.githubIssueUrl && (
                <a
                  href={task.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-tiny text-purple-500 underline decoration-purple-500/40 underline-offset-2 transition-colors hover:text-purple-400 hover:decoration-purple-400"
                >
                  <CircleDot className="size-3" />
                  <span>Issue</span>
                </a>
              )}
              {task.githubPrUrl && (
                <a
                  href={task.githubPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-tiny text-emerald-500 underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-400 hover:decoration-emerald-400"
                >
                  <GitPullRequest className="size-3" />
                  <span>PR</span>
                </a>
              )}
            </div>
          )}
          <span className="ml-auto text-tiny text-muted-foreground/60 tabular-nums">
            {formatTimeAgo(task.updatedAt.microsSinceUnixEpoch)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function VoteListRow({ vote, ideaTitle }: { vote: VotesRow; ideaTitle: string }) {
  const vt = vote.voteType.tag;
  return (
    <div className="group flex items-center gap-3 border-b border-border/10 px-4 py-3 transition-colors hover:bg-white/2">
      <div className="flex h-full w-6 items-center justify-center">
        {vt === "Up" ? (
          <ArrowUp className="size-4 shrink-0 text-success" />
        ) : vt === "Down" ? (
          <ArrowDown className="size-4 shrink-0 text-cyan-400" />
        ) : (
          <ArrowDown className="size-4 shrink-0 text-destructive" />
        )}
      </div>
      <VoteScoreTooltip scores={vote.scores} />
      <Link
        to={`/ideas/${vote.ideaId.toString()}`}
        className="min-w-0 flex-1 text-[15px] text-foreground/90 hover:text-primary"
      >
        <span className="line-clamp-1">{ideaTitle}</span>
      </Link>
      <span className="text-tiny text-muted-foreground/60 tabular-nums">
        {formatTimeAgo(vote.createdAt.microsSinceUnixEpoch)}
      </span>
    </div>
  );
}

function VoiceAnnouncementRow({
  announcement,
  isPlaying,
  onToggle,
}: {
  announcement: VoiceAnnouncement;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  const transcript =
    announcement.transcript.length > 140
      ? `${announcement.transcript.slice(0, 139).trimEnd()}...`
      : announcement.transcript;

  return (
    <div className="group flex items-start gap-3 border-b border-border/10 px-4 py-3 transition-colors hover:bg-white/2">
      <button
        type="button"
        onClick={onToggle}
        className="mt-0.5 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-surface-elevated transition-colors hover:border-primary/50 hover:bg-surface-overlay"
        title={isPlaying ? "Pause announcement" : "Play announcement"}
      >
        {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] leading-relaxed text-foreground/90">{transcript}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-tiny text-muted-foreground">
            Voice #{announcement.seq.toString()}
          </span>
          <span className="ml-auto text-tiny text-muted-foreground/60 tabular-nums">
            {formatTimeAgo(announcement.createdAt.microsSinceUnixEpoch)}
          </span>
        </div>
      </div>
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-label text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-xl font-semibold text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[22rem] flex-col overflow-hidden lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3">
        {icon}
        <span className="text-xs font-semibold tracking-wide text-foreground uppercase sm:text-sm">
          {title}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums sm:text-sm">
          {count}
        </span>
      </div>
      <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-0 flex-1 overflow-y-visible lg:overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    agent,
    assignedTasks,
    createdTasks,
    proposedIdeas,
    votes,
    messages,
    projectMessages,
    discoveries,
    reviewedDiscoveries,
    collaborators,
    isReady,
  } = useAgent(id || "");
  const allIdeas = useIdeas();
  const ideaTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const idea of allIdeas) {
      map.set(idea.id.toString(), idea.title);
    }
    return map;
  }, [allIdeas]);
  const announcements = useVoiceAnnouncements();
  const [playingAnnouncementId, setPlayingAnnouncementId] = useState<bigint | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const agentVoiceAnnouncements = useMemo(() => {
    if (!agent) return [];

    const targetIdentity = agent.identity.toHexString().toLowerCase();
    const targetName = agent.name.toLowerCase();

    return announcements
      .filter((a) => {
        const byIdentity = a.agentId.toHexString().toLowerCase() === targetIdentity;
        const byName = a.agentName.toLowerCase() === targetName;
        return (byIdentity || byName) && AnnouncementStatusEnum.is.ready(a.status) && !!a.audioUrl;
      })
      .sort((a, b) => Number(b.createdAt.microsSinceUnixEpoch - a.createdAt.microsSinceUnixEpoch));
  }, [announcements, agent]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  if (!isReady) {
    return (
      <AppShell>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
            <div className="h-24 animate-pulse rounded-md bg-muted" />
            <div className="h-56 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!agent) {
    return (
      <AppShell>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <div className="mx-auto w-full max-w-7xl p-8">
            <div className="rounded-md border border-border bg-card p-8 text-center">
              <h1 className="text-xl font-semibold">Agent not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                No agent exists with ID{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{id}</code>.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const activity = buildActivity(
    assignedTasks,
    createdTasks,
    proposedIdeas,
    votes,
    messages,
    projectMessages,
    discoveries,
    reviewedDiscoveries,
  );

  const taskCount = assignedTasks.length + createdTasks.length;
  const ideaCount = proposedIdeas.length;
  const voteCount = votes.length;
  const messageCount = messages.length + projectMessages.length;
  const discoveryCount = discoveries.length + reviewedDiscoveries.length;

  const handleToggleAnnouncement = (announcement: VoiceAnnouncement) => {
    if (playingAnnouncementId === announcement.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingAnnouncementId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(announcement.audioUrl);
    audioRef.current = audio;
    setPlayingAnnouncementId(announcement.id);

    audio.onended = () => {
      setPlayingAnnouncementId((current) => (current === announcement.id ? null : current));
      if (audioRef.current === audio) audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingAnnouncementId((current) => (current === announcement.id ? null : current));
      if (audioRef.current === audio) audioRef.current = null;
    };

    void audio.play().catch(() => {
      setPlayingAnnouncementId((current) => (current === announcement.id ? null : current));
      if (audioRef.current === audio) audioRef.current = null;
    });
  };

  const memberSince = new Date(
    Number(agent.createdAt.microsSinceUnixEpoch / 1000n),
  ).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  const lastActive = new Date(
    Number(agent.lastActiveAt.microsSinceUnixEpoch / 1000n),
  ).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="shrink-0 border-b border-border bg-surface">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4 lg:px-8">
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate("/")}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-border bg-surface-elevated transition-all hover:border-primary/50 hover:bg-surface-overlay"
                title="Back to dashboard"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div>
                <h1 className="max-w-[10rem] truncate text-sm font-semibold tracking-tight text-foreground sm:max-w-none sm:text-base lg:text-lg">
                  {agent.name}
                </h1>
                <div className="mt-1 text-xs text-muted-foreground">@{agent.id.toLowerCase()}</div>
              </div>
            </div>
            <div className="hidden items-center justify-center gap-7 lg:flex">
              <InlineStat label="Tasks" value={taskCount} />
              <InlineStat label="Ideas" value={ideaCount} />
              <InlineStat label="Votes" value={voteCount} />
              <InlineStat label="Messages" value={messageCount} />
              <InlineStat label="Discoveries" value={discoveryCount} />
            </div>
            <div className="hidden items-center justify-end gap-6 text-xs md:flex">
              <div className="text-right">
                <div className="text-label text-muted-foreground">Member since</div>
                <div className="mt-0.5 font-mono text-foreground">{memberSince}</div>
              </div>
              <div className="text-right">
                <div className="text-label text-muted-foreground">Last active</div>
                <div className="mt-0.5 font-mono text-foreground">{lastActive}</div>
              </div>
            </div>
          </div>
        </header>

        <header className="shrink-0 border-b border-border bg-surface">
          <div className="w-full px-6 py-6 lg:px-8 lg:py-8">
            <TooltipProvider>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <AgentProfileHeader
                  agent={agent}
                  collaborators={collaborators}
                  className="max-w-4xl flex-1"
                />
                {agentVoiceAnnouncements.length > 0 && (
                  <div className="w-full max-w-xl bg-background lg:max-w-sm">
                    <div className="flex items-center border-b border-border bg-background px-4 py-2.5 text-label text-muted-foreground/70">
                      <span>Voice announcements</span>
                      <span className="ml-auto font-mono text-tiny">
                        {agentVoiceAnnouncements.length}
                      </span>
                    </div>
                    <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent max-h-64 overflow-y-auto">
                      {agentVoiceAnnouncements.map((announcement) => (
                        <VoiceAnnouncementRow
                          key={announcement.id.toString()}
                          announcement={announcement}
                          isPlaying={playingAnnouncementId === announcement.id}
                          onToggle={() => handleToggleAnnouncement(announcement)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:h-full lg:[grid-template-columns:repeat(3,minmax(0,32rem))] lg:justify-center">
            <div className="min-h-[22rem] lg:h-full lg:min-h-0">
              <KanbanColumn
                title="Ideas"
                count={ideaCount + voteCount}
                icon={<Lightbulb className="size-4 text-warning" />}
              >
                {ideaCount === 0 && voteCount === 0 ? (
                  <div className="px-4 py-10 text-center text-base text-muted-foreground">
                    No ideas or votes yet.
                  </div>
                ) : (
                  <>
                    {proposedIdeas.map((idea) => (
                      <IdeaListRow key={idea.id.toString()} idea={idea} />
                    ))}
                    {voteCount > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 border-b border-border/40 bg-surface-elevated/20 px-4 py-2 text-label text-muted-foreground/70">
                          <ArrowUp className="size-3" />
                          Votes
                          <span className="font-mono text-tiny">{voteCount}</span>
                        </div>
                        {votes.map((vote) => (
                          <VoteListRow
                            key={vote.id.toString()}
                            vote={vote}
                            ideaTitle={
                              ideaTitleById.get(vote.ideaId.toString()) ||
                              `Idea #${vote.ideaId.toString()}`
                            }
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </KanbanColumn>
            </div>

            <div className="min-h-[22rem] lg:h-full lg:min-h-0">
              <KanbanColumn
                title="Activity"
                count={activity.length}
                icon={<MessageSquare className="size-4 text-primary" />}
              >
                <TooltipProvider>
                  {activity.length === 0 ? (
                    <div className="px-4 py-10 text-center text-base text-muted-foreground">
                      No activity yet.
                    </div>
                  ) : (
                    <>
                      {activity.map((item) => (
                        <ActivityFeedRow
                          key={`${item.kind}-${item.data.id.toString()}`}
                          item={item}
                        />
                      ))}
                    </>
                  )}
                </TooltipProvider>
              </KanbanColumn>
            </div>

            <div className="min-h-[22rem] lg:h-full lg:min-h-0">
              <KanbanColumn
                title="Tasks"
                count={taskCount + discoveryCount}
                icon={<CheckCircle className="size-4 text-accent" />}
              >
                <TooltipProvider>
                  {taskCount === 0 && discoveryCount === 0 ? (
                    <div className="px-4 py-10 text-center text-base text-muted-foreground">
                      No tasks or discoveries yet.
                    </div>
                  ) : (
                    <>
                      {assignedTasks.map((t) => (
                        <TaskRow key={t.id.toString()} task={t} />
                      ))}
                      {createdTasks.map((t) => (
                        <TaskRow key={t.id.toString()} task={t} />
                      ))}

                      {discoveryCount > 0 && (
                        <>
                          <div className="flex items-center gap-1.5 border-b border-border/40 bg-surface-elevated/20 px-4 py-2 text-label text-muted-foreground/70">
                            <Compass className="size-3" />
                            Discoveries
                            <span className="font-mono text-tiny">{discoveryCount}</span>
                          </div>
                          {discoveries.map((d) => (
                            <ActivityFeedRow
                              key={d.id.toString()}
                              item={{ kind: "discovery", data: d, prefix: "Discovered" }}
                            />
                          ))}
                          {reviewedDiscoveries.map((d) => (
                            <ActivityFeedRow
                              key={d.id.toString()}
                              item={{ kind: "discovery", data: d, prefix: "Reviewed" }}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </TooltipProvider>
              </KanbanColumn>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
