import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { m, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowBigUp, ArrowBigDown, Octagon, FolderOpen, X } from "lucide-react";
import { AppShell } from "@/components/layout";
import { useIdea } from "@/hooks/useIdea";
import { useAgents, useConnectionStatus, useIdeas } from "@/spacetime/hooks";
import { IdeaStatusEnum } from "@/spacetime/hooks";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { HumanTaskDialog } from "@/components/ui/HumanTaskDialog";
import { CyberProgress } from "@/components/ui/CyberProgress";
import type { VotesRow, AgentsRow, VoteType } from "@/spacetime/hooks";

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
  return then.toISOString().slice(11, 16);
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

function VoteRow({
  vote,
  voter,
  index,
}: {
  vote: VotesRow;
  voter: AgentsRow | undefined;
  index: number;
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

  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group flex items-center gap-4 border-b border-border/20 px-5 py-4 transition-all duration-200 hover:bg-surface-elevated/30"
    >
      <div className="w-20 shrink-0 text-sm font-medium text-muted-foreground">
        {formatTimeShort(vote.createdAt)}
      </div>

      <div className="flex w-20 shrink-0 items-center gap-2">
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
            <section>
              <CyberProgress
                value={idea.totalVotes}
                max={idea.quorum}
                label="Quorum Progress"
                color="primary"
                size="lg"
              />
            </section>

            <m.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-md bg-surface text-left font-mono"
            >
              <div className="grid grid-cols-3 gap-6">
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
                    threshold
                  </div>
                  <div className="mt-1 text-center text-sm font-semibold text-foreground">
                    {idea.approvalThreshold}
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
                  <>
                    <div className="flex items-center gap-4 border-b border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-muted-foreground">
                      <div className="w-20 shrink-0">TIME</div>
                      <div className="w-20 shrink-0">VOTE</div>
                      <div className="flex-1">AGENT</div>
                    </div>

                    <div className="divide-y divide-border/20">
                      <AnimatePresence>
                        {sortedVotes.map((vote, index) => (
                          <VoteRow
                            key={vote.id.toString()}
                            vote={vote}
                            voter={voterMap[vote.agentId]}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </>
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
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
      navigate={navigate}
    />
  );
}
