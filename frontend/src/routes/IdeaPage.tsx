import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { m, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowBigUp, ArrowBigDown, Octagon, FolderOpen, X, Info } from "lucide-react";
import { AppShell } from "@/components/layout";
import { cn } from "@/lib/utils";
import { useIdea } from "@/hooks/useIdea";
import {
  useAgents,
  useConnectionStatus,
  useIdeas,
  useEvaluationDimensions,
} from "@/spacetime/hooks";
import { IdeaStatusEnum } from "@/spacetime/hooks";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { HumanTaskDialog } from "@/components/ui/HumanTaskDialog";
import { CyberProgress } from "@/components/ui/CyberProgress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import type { VotesRow, AgentsRow, VoteType } from "@/spacetime/hooks";
import type { DimensionScore } from "@/spacetime/generated/types";

const APPROVAL_THRESHOLD = 7.0;
const VETO_FLOOR = 2.0;
const MIN_SCORE = 1;
const MAX_SCORE = 10;

function getScoreTextClass(score: number): string {
  if (score >= APPROVAL_THRESHOLD) return "text-success";
  if (score >= VETO_FLOOR) return "text-cyan-400";
  return "text-destructive";
}

function getScoreProgressColor(score: number): "success" | "cyan" | "destructive" {
  if (score >= APPROVAL_THRESHOLD) return "success";
  if (score >= VETO_FLOOR) return "cyan";
  return "destructive";
}

function formatTimeAgo(timestamp: { microsSinceUnixEpoch: bigint }): string {
  const now = Date.now();
  const then = Number(timestamp.microsSinceUnixEpoch / 1000n);
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function formatTimeShort(timestamp: { microsSinceUnixEpoch: bigint }): string {
  const then = new Date(Number(timestamp.microsSinceUnixEpoch / 1000n));
  const day = then.getDate();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[then.getMonth()];
  const time = then.toISOString().slice(11, 16);
  return `${day} ${month} ${time}`;
}

function StatusBadge({ status }: { status: string }) {
  const displayStatus = status === "ApprovedForProject" ? "Approved" : status;
  const colors: Record<string, string> = {
    Voting: "text-warning",
    Approved: "text-success",
    ApprovedForProject: "text-success",
    Rejected: "text-destructive",
    Implemented: "text-accent",
  };

  return (
    <span
      className={`text-xs font-semibold tracking-wider ${colors[status] || "text-muted-foreground"}`}
    >
      [{displayStatus.toUpperCase()}]
    </span>
  );
}

function formatDimensionLabel(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function computeWeightedScore(
  scores: DimensionScore[],
  dimensionWeights: DimensionWeightMap,
): number {
  if (scores.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [name, dim] of dimensionWeights) {
    const score = scores.find((s) => s.dimension === name);
    const rawScore = score ? score.score : (dim.minScore + dim.maxScore) / 2;
    const clamped = Math.max(dim.minScore, Math.min(dim.maxScore, rawScore));
    const range = dim.maxScore - dim.minScore;
    const normalized = range > 0 ? (clamped - dim.minScore) / range : 0;
    weightedSum += dim.weight * normalized;
    totalWeight += dim.weight;
  }

  if (totalWeight === 0) return 0;
  return (weightedSum / totalWeight) * MAX_SCORE;
}

function ScoreBreakdownCard({ scores }: { scores: DimensionScore[] }) {
  if (scores.length === 0) return null;

  return (
    <div className="min-w-64 space-y-2 p-2">
      <div className="mb-1 pb-2 text-center font-mono text-xs tracking-normal uppercase">
        dimension scores
      </div>
      {scores.map((s) => (
        <div key={s.dimension} className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              {formatDimensionLabel(s.dimension)}
            </span>
            <span className={cn("font-mono text-sm font-bold", getScoreTextClass(s.score))}>
              {s.score}
            </span>
          </div>
          <CyberProgress
            value={s.score}
            max={MAX_SCORE}
            color={getScoreProgressColor(s.score)}
            size="sm"
            showPercentage={false}
            showLabels={false}
          />
        </div>
      ))}
      <div className="pt-1 font-mono text-tiny text-muted-foreground/70">
        Scale {MIN_SCORE}-{MAX_SCORE} / ≥{APPROVAL_THRESHOLD} approve / ≤{VETO_FLOOR} veto
      </div>
    </div>
  );
}

type DimensionWeightMap = Map<string, { weight: number; minScore: number; maxScore: number }>;

function ScoreCell({
  scores,
  dimensionWeights,
}: {
  scores: DimensionScore[];
  dimensionWeights: DimensionWeightMap;
}) {
  const weightedScore = computeWeightedScore(scores, dimensionWeights);

  return (
    <Tooltip side="right" align="start">
      <TooltipTrigger asChild>
        <div className="flex w-16 shrink-0 cursor-default items-center justify-center gap-1">
          <span className={cn("text-sm font-bold tabular-nums", getScoreTextClass(weightedScore))}>
            {weightedScore.toFixed(1)}
          </span>
          <Info className="h-3 w-3 text-muted-foreground/50" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="rounded-lg border-success/20 bg-surface px-4 py-3 font-mono shadow-2xl shadow-success/10">
        <ScoreBreakdownCard scores={scores} />
      </TooltipContent>
    </Tooltip>
  );
}

function VoteRow({
  vote,
  voter,
  index,
  dimensionWeights,
}: {
  vote: VotesRow;
  voter: AgentsRow | undefined;
  index: number;
  dimensionWeights: DimensionWeightMap;
}) {
  const getVoteIcon = (voteType: VoteType) => {
    if (voteType.tag === "Up") {
      return <ArrowBigUp className="h-5 w-5 text-success" />;
    }
    if (voteType.tag === "Down") {
      return <ArrowBigDown className="h-5 w-5 text-cyan-400" />;
    }
    return <Octagon className="h-5 w-5 text-destructive" />;
  };

  const getVoteLabel = (voteType: VoteType) => {
    if (voteType.tag === "Up") return "UP";
    if (voteType.tag === "Down") return "DOWN";
    return "VETO";
  };

  const getVoteColor = (voteType: VoteType) => {
    if (voteType.tag === "Up") return "text-success";
    if (voteType.tag === "Down") return "text-cyan-400";
    return "text-destructive";
  };

  const getVoteTint = (voteType: VoteType) => {
    if (voteType.tag === "Up") return "bg-linear-to-r from-success/5 to-success/10";
    if (voteType.tag === "Down") return "bg-linear-to-r from-cyan-400/2 to-cyan-400/4";
    return "bg-linear-to-r from-destructive/2 to-destructive/4";
  };

  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "group flex items-center gap-4 border-b border-border/20 px-5 py-4 transition-all duration-200 hover:bg-surface-elevated/30",
        getVoteTint(vote.voteType),
      )}
    >
      <ScoreCell scores={vote.scores} dimensionWeights={dimensionWeights} />

      <div className="flex w-20 shrink-0 items-center justify-center gap-2">
        {getVoteIcon(vote.voteType)}
        <span className={`text-xs font-bold ${getVoteColor(vote.voteType)}`}>
          {getVoteLabel(vote.voteType)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {voter && (
          <AlienAvatar seed={voter.zenonAddress || voter.identity.toHexString()} size={28} />
        )}
        <span className="truncate text-base font-medium text-foreground">
          {voter?.name || vote.agentId}
        </span>
      </div>

      <div className="w-24 shrink-0 text-right text-sm font-medium text-muted-foreground">
        {formatTimeShort(vote.createdAt)}
      </div>
    </m.div>
  );
}

function IdeaNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-6xl font-bold text-muted-foreground"
      >
        404
      </m.div>
      <p className="mb-8 text-lg text-muted-foreground">Idea not found in registry</p>
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/")}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-primary/30 px-6 py-3 text-base text-primary transition-colors hover:bg-primary/5 hover:text-primary/80"
      >
        <ArrowLeft className="h-5 w-5" />
        Return to dashboard
      </m.button>
    </div>
  );
}

function IdeaLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-sm text-muted-foreground"
      >
        Loading idea...
      </m.div>
    </div>
  );
}

type IdeaPageViewProps = {
  idea: NonNullable<ReturnType<typeof useIdea>["idea"]>;
  votes: VotesRow[];
  linkedProject: ReturnType<typeof useIdea>["linkedProject"];
  creator: ReturnType<typeof useIdea>["creator"];
  activeAgentCount: number;
  isVoting: boolean;
  sortedVotes: VotesRow[];
  voterMap: Record<string, AgentsRow>;
  dimensionWeights: DimensionWeightMap;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
};

function IdeaPageView({
  idea,
  votes,
  linkedProject,
  creator,
  activeAgentCount,
  isVoting,
  sortedVotes,
  voterMap,
  dimensionWeights,
  dialogOpen,
  setDialogOpen,
  navigate,
}: IdeaPageViewProps) {
  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="shrink-0 border-b border-border bg-surface">
          <div className="flex items-center justify-between px-6 py-5 lg:px-8">
            <div className="flex items-center gap-5">
              <m.button
                onClick={() => navigate("/")}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border border-border bg-surface-elevated transition-all hover:border-primary/50 hover:bg-surface-overlay"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Back to dashboard"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </m.button>

              <div className="hidden h-8 w-px bg-border sm:block" />

              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">{idea.title}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono">ID: {idea.id.toString()}</span>
                  <span className="hidden text-border sm:inline">|</span>
                  <StatusBadge status={idea.status.tag} />
                  {idea.category && (
                    <>
                      <span className="hidden text-border sm:inline">|</span>
                      <span className="text-muted-foreground">{idea.category}</span>
                    </>
                  )}
                  <span className="hidden text-border sm:inline">|</span>
                  <div className="flex items-center gap-2">
                    {creator && (
                      <AlienAvatar
                        seed={creator.zenonAddress || creator.identity.toHexString()}
                        size={20}
                      />
                    )}
                    <span>@{(creator?.id || idea.createdBy)?.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-4 text-sm md:flex">
              {linkedProject ? (
                <div className="text-right">
                  <div className="text-xs tracking-wider text-muted-foreground uppercase">
                    Project
                  </div>
                  <m.button
                    onClick={() => navigate(`/projects/${linkedProject.id}`)}
                    className="flex cursor-pointer items-center gap-1 text-foreground transition-colors hover:text-primary"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-success" />
                    <span className="max-w-30 truncate text-success">{linkedProject.name}</span>
                  </m.button>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-xs tracking-wider text-muted-foreground uppercase">
                    Project
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <X className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="mt-1 text-tiny text-muted-foreground">None</span>
                  </div>
                </div>
              )}
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <div className="text-xs tracking-wider text-muted-foreground uppercase">
                  Created
                </div>
                <div className="mt-1 flex items-center gap-1 text-tiny text-foreground">
                  <span>{formatTimeAgo(idea.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
            <section className="space-y-3">
              <CyberProgress
                value={idea.computedScore}
                max={MAX_SCORE}
                label="Score"
                color={getScoreProgressColor(idea.computedScore)}
                size="lg"
                valueLabel={idea.computedScore.toFixed(1)}
              />
              <CyberProgress
                value={idea.totalVotes}
                max={idea.quorum}
                label="Quorum"
                color={idea.totalVotes >= idea.quorum ? "success" : "primary"}
                size="md"
              />
            </section>

            <m.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-md bg-surface text-left font-mono"
            >
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-md bg-surface-elevated/20">
                  <div className="text-center text-tiny tracking-wider text-muted-foreground uppercase">
                    score
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-center text-sm font-semibold",
                      getScoreTextClass(idea.computedScore),
                    )}
                  >
                    {idea.computedScore.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-md bg-surface-elevated/20">
                  <div className="text-center text-tiny tracking-wider text-muted-foreground uppercase">
                    participation
                  </div>
                  <div className="mt-1 text-center text-sm font-semibold text-foreground">
                    {idea.totalVotes}/{activeAgentCount}
                  </div>
                </div>
                <div className="rounded-md bg-surface-elevated/20">
                  <div className="text-center text-tiny tracking-wider text-muted-foreground uppercase">
                    approval
                  </div>
                  <div className="mt-1 text-center text-sm font-semibold text-foreground">
                    ≥ 7.0
                  </div>
                </div>
                <div className="rounded-md bg-surface-elevated/20">
                  <div className="text-center text-tiny tracking-wider text-muted-foreground uppercase">
                    veto limit
                  </div>
                  <div className="mt-1 text-center text-sm font-semibold text-foreground">
                    {idea.vetoThreshold}
                  </div>
                </div>
              </div>
            </m.section>

            <m.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-md border border-border bg-surface p-6"
            >
              <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Description
              </h2>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/80">
                {idea.description || "No description provided."}
              </p>
            </m.section>

            <section className="grid grid-cols-3 gap-4">
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-md bg-surface p-5 text-center"
              >
                <ArrowBigUp className="mx-auto mb-2 h-8 w-8 text-success" />
                <div className="text-3xl font-bold text-success">{idea.upVotes}</div>
                <div className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">
                  UP
                </div>
              </m.div>
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-md bg-surface p-5 text-center"
              >
                <ArrowBigDown className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
                <div className="text-3xl font-bold text-cyan-400">{idea.downVotes}</div>
                <div className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">
                  DOWN
                </div>
              </m.div>
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-md bg-surface p-5 text-center"
              >
                <Octagon className="mx-auto mb-2 h-8 w-8 text-destructive" />
                <div className="text-3xl font-bold text-destructive">{idea.vetoCount}</div>
                <div className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">
                  VETO
                </div>
              </m.div>
            </section>

            {isVoting && (
              <m.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-md border border-border bg-surface p-5"
              >
                <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Cast Vote
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <m.button
                    onClick={() => setDialogOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-success/10 py-4 transition-colors hover:bg-success/20"
                  >
                    <ArrowBigUp className="h-6 w-6 text-success" />
                    <span className="text-base font-bold text-success">Up</span>
                  </m.button>
                  <m.button
                    onClick={() => setDialogOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-500/10 py-4 transition-colors hover:bg-cyan-500/20"
                  >
                    <ArrowBigDown className="h-6 w-6 text-cyan-400" />
                    <span className="text-base font-bold text-cyan-400">Down</span>
                  </m.button>
                  <m.button
                    onClick={() => setDialogOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-destructive/10 py-4 transition-colors hover:bg-destructive/20"
                  >
                    <Octagon className="h-6 w-6 text-destructive" />
                    <span className="text-base font-bold text-destructive">Veto</span>
                  </m.button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-tiny text-muted-foreground/50">
                  <Info className="h-3 w-3" />
                  <span>
                    Votes are cast via{" "}
                    <a
                      href="https://github.com/zenon-red/probe"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <code className="font-mono underline decoration-dotted underline-offset-2 transition-colors hover:text-muted-foreground">
                        Probe
                      </code>
                    </a>{" "}
                    using structured dimension scores.{" "}
                    <a
                      href="https://github.com/zenon-red/nexus/blob/main/docs/idea-evaluation.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-dotted underline-offset-2 transition-colors hover:text-muted-foreground"
                    >
                      Evaluation criteria
                    </a>
                  </span>
                </div>
              </m.section>
            )}

            {linkedProject && (
              <m.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="cursor-pointer rounded-md border border-border bg-surface p-6"
                onClick={() => navigate(`/projects/${linkedProject.id}`)}
              >
                <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Project
                </h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-surface-elevated p-2">
                      <FolderOpen className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-success underline decoration-success/40 underline-offset-2 transition-colors hover:text-emerald-400 hover:decoration-emerald-400">
                        {linkedProject.name}
                      </div>
                    </div>
                  </div>
                </div>
              </m.section>
            )}

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold tracking-wider text-foreground uppercase">
                  Vote Stream
                </h2>
                <span className="text-sm text-muted-foreground">{votes.length} votes</span>
              </div>

              <div className="overflow-hidden rounded-md border border-border bg-surface">
                {votes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-base text-muted-foreground">
                    No votes yet
                  </div>
                ) : (
                  <TooltipProvider>
                    <div className="flex items-center gap-4 border-b border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-muted-foreground">
                      <div className="w-16 shrink-0 text-center">SCORE</div>
                      <div className="w-20 shrink-0 text-center">VOTE</div>
                      <div className="flex-1">AGENT</div>
                      <div className="w-24 shrink-0 text-right">TIME</div>
                    </div>

                    <div className="divide-y divide-border/20">
                      <AnimatePresence>
                        {sortedVotes.map((vote, index) => (
                          <VoteRow
                            key={vote.id.toString()}
                            vote={vote}
                            voter={voterMap[vote.agentId]}
                            index={index}
                            dimensionWeights={dimensionWeights}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </TooltipProvider>
                )}
              </div>
            </section>
          </div>
        </div>

        <HumanTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AppShell>
  );
}

export function IdeaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agents = useAgents();
  const ideas = useIdeas();
  const dimensions = useEvaluationDimensions();
  const isConnected = useConnectionStatus();
  const { idea, votes, voters, linkedProject, creator } = useIdea(id || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notFoundDelayElapsed, setNotFoundDelayElapsed] = useState(false);

  useEffect(() => {
    if (idea || !isConnected || ideas.length > 0) {
      setNotFoundDelayElapsed(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotFoundDelayElapsed(true);
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [idea, isConnected, ideas.length, id]);

  const showNotFound = !idea && isConnected && (ideas.length > 0 || notFoundDelayElapsed);

  const voterMap = useMemo(() => {
    return voters.reduce(
      (acc, v) => {
        acc[v.id] = v;
        return acc;
      },
      {} as Record<string, AgentsRow>,
    );
  }, [voters]);

  const dimensionWeights = useMemo(() => {
    const map: DimensionWeightMap = new Map();
    for (const dim of dimensions) {
      if (dim.weight > 0 && dim.maxScore > dim.minScore) {
        map.set(dim.name, {
          weight: dim.weight,
          minScore: dim.minScore,
          maxScore: dim.maxScore,
        });
      }
    }
    return map;
  }, [dimensions]);

  const sortedVotes = useMemo(() => {
    return [...votes].sort(
      (a, b) => Number(b.createdAt.microsSinceUnixEpoch) - Number(a.createdAt.microsSinceUnixEpoch),
    );
  }, [votes]);

  if (!idea && !showNotFound) {
    return (
      <AppShell>
        <IdeaLoading />
      </AppShell>
    );
  }

  if (!idea) {
    return (
      <AppShell>
        <IdeaNotFound />
      </AppShell>
    );
  }

  const isVoting = IdeaStatusEnum.is.voting(idea.status);
  const activeAgentCount = agents.length;

  return (
    <IdeaPageView
      idea={idea}
      votes={votes}
      linkedProject={linkedProject}
      creator={creator}
      activeAgentCount={activeAgentCount}
      isVoting={isVoting}
      sortedVotes={sortedVotes}
      voterMap={voterMap}
      dimensionWeights={dimensionWeights}
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
      navigate={navigate}
    />
  );
}
