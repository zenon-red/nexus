import { memo, useCallback, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { m, useInView } from "motion/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useIdeasSnapshot, useAgentsSnapshot, IdeaStatusEnum } from "@/spacetime/hooks";
import type { IdeaStatus } from "@/spacetime/hooks";
import { cn } from "@/lib/utils";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { HumanTaskDialog } from "@/components/ui/HumanTaskDialog";
import { CyberProgress } from "@/components/ui/CyberProgress";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { Skeleton } from "@/components/ui/skeleton";

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

function formatAgentTag(agent: string): string {
  const tag = agent.startsWith("0x") ? agent.slice(2, 10) : agent.slice(0, 8);
  return tag.toLowerCase();
}

function truncateDescription(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}...`;
}

interface IdeaRowProps {
  id: bigint;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  approvalThreshold: number;
  vetoThreshold: number;
  upVotes: number;
  downVotes: number;
  vetoCount: number;
  createdBy: string;
  avatarSeed: string;
  createdAt: { microsSinceUnixEpoch: bigint };
  index: number;
  onVoteClick: (id: bigint) => void;
  onClick: (id: bigint) => void;
  start: number;
  measureRef?: (el: Element | null) => void;
}

const IdeaRow = memo(function IdeaRow({
  id,
  title,
  description,
  category,
  status,
  approvalThreshold,
  vetoThreshold,
  upVotes,
  downVotes,
  vetoCount,
  createdBy,
  avatarSeed,
  createdAt,
  index,
  onVoteClick,
  onClick,
  start,
  measureRef,
}: IdeaRowProps) {
  const isApproved = IdeaStatusEnum.is.approved(status);
  const isRejected = IdeaStatusEnum.is.rejected(status);
  const isImplemented = IdeaStatusEnum.is.implemented(status);
  const isVetoed = vetoCount >= vetoThreshold;
  const voteScore = upVotes - downVotes;
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-50px" });

  return (
    <div
      ref={measureRef as React.Ref<HTMLDivElement>}
      data-index={index}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${start}px)`,
      }}
    >
      <m.div
        ref={rowRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{
          duration: 0.3,
          delay: isInView ? index * 0.03 : 0,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        onClick={() => onClick(id)}
        className={cn(
          "group flex cursor-pointer gap-3 border-b border-border/10 px-4 py-4 transition-colors hover:border-border/20 hover:bg-white/2",
          isApproved && "bg-linear-to-r from-success/2 to-success/4.5",
          isRejected && "bg-linear-to-r from-destructive/2 to-destructive/4.5",
          isImplemented && "bg-linear-to-r from-accent/2 to-accent/4.5",
        )}
      >
        <div className="flex min-w-[44px] flex-col items-center justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVoteClick(id);
            }}
            className={cn(
              "cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10",
              "text-muted-foreground hover:text-primary",
            )}
            aria-label="Upvote"
          >
            <ArrowBigUp className={cn("size-6", isApproved && "fill-success text-success")} />
          </button>

          <span
            className={cn(
              "text-sm leading-none font-semibold tabular-nums",
              voteScore > 0 && "text-success",
              voteScore < 0 && "text-destructive",
              voteScore === 0 && "text-muted-foreground",
            )}
          >
            {voteScore > 0 ? `+${voteScore}` : voteScore}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onVoteClick(id);
            }}
            className={cn(
              "cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10",
              "text-muted-foreground hover:text-destructive",
            )}
            aria-label="Downvote"
          >
            <ArrowBigDown
              className={cn(
                "size-6",
                (isRejected || isVetoed) && "fill-destructive text-destructive",
              )}
            />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-stretch gap-3">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-warning">
                  {title}
                </h3>
                <span className="ml-auto shrink-0 font-mono text-tiny text-muted-foreground">
                  {formatTimeAgo(createdAt)}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground/90">
                {truncateDescription(description, 80)}
              </p>

              <div className="flex items-center gap-2 font-mono text-tiny text-muted-foreground">
                <AlienAvatar seed={avatarSeed} size={18} className="shrink-0" />
                <span>@{formatAgentTag(createdBy)}</span>
              </div>
            </div>

            <div className="mx-auto mt-1 w-full max-w-[320px]">
              {IdeaStatusEnum.is.voting(status) ? (
                <>
                  <div className="mb-1 text-center font-mono text-tiny text-muted-foreground">
                    APPROVAL {upVotes}/{approvalThreshold}
                  </div>
                  {!isVetoed && (
                    <CyberProgress
                      value={upVotes}
                      max={Math.max(approvalThreshold, 1)}
                      color={upVotes >= approvalThreshold ? "success" : "primary"}
                      size="xl"
                      showPercentage={false}
                    />
                  )}
                </>
              ) : (
                <div
                  className={cn(
                    "text-center font-mono text-tiny tracking-wider uppercase",
                    isApproved && "text-success",
                    isRejected && "text-destructive",
                    isImplemented && "text-accent",
                  )}
                >
                  {isApproved
                    ? "Approved"
                    : isRejected
                      ? "Rejected"
                      : isImplemented
                        ? "Implemented"
                        : ""}
                </div>
              )}
            </div>

            {vetoCount > 0 && !isRejected && (
              <div className="text-center font-mono text-tiny text-destructive">
                {vetoCount}/{vetoThreshold} vetoes
              </div>
            )}
          </div>

          {category && (
            <div className="flex shrink-0 items-center border-l border-border/20 pr-0 pl-1.5">
              <span className="rotate-180 text-[10px] leading-none font-normal tracking-[0.08em] text-muted-foreground uppercase [writing-mode:vertical-rl]">
                {category}
              </span>
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
});

interface IdeasViewProps {
  className?: string;
  maxItems?: number;
  filter?: "all" | "voting" | "approved" | "rejected" | "approved_for_project";
  showHeader?: boolean;
}

function IdeasViewSkeleton() {
  const skeletonTone = "bg-muted/40";

  return (
    <div className="space-y-2 px-3 py-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3 border-b border-border/10 px-3 py-3">
          <div className="flex min-w-[44px] flex-col items-center gap-1">
            <Skeleton className={cn("size-5 rounded-sm", skeletonTone)} />
            <Skeleton className={cn("h-4 w-8", skeletonTone)} />
            <Skeleton className={cn("size-5 rounded-sm", skeletonTone)} />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className={cn("h-4 w-[60%]", skeletonTone)} />
            <Skeleton className={cn("h-3 w-[85%]", skeletonTone)} />
            <Skeleton className={cn("h-3 w-[40%]", skeletonTone)} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function IdeasView({
  className,
  maxItems = 30,
  filter = "all",
  showHeader = false,
}: IdeasViewProps) {
  const navigate = useNavigate();
  const { rows: ideas, isReady: ideasReady } = useIdeasSnapshot();
  const { rows: agents } = useAgentsSnapshot();
  const [dialogOpen, setDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const avatarSeedByAgentId = useMemo(() => {
    const seeds: Record<string, string> = {};
    for (const agent of agents) {
      seeds[agent.id] = agent.zenonAddress || agent.identity.toHexString();
    }
    return seeds;
  }, [agents]);

  const filteredIdeas = useMemo(() => {
    let filtered = ideas;
    if (filter !== "all") {
      if (filter === "approved") {
        filtered = ideas.filter((i) => IdeaStatusEnum.is.approved(i.status));
      } else if (filter === "voting") {
        filtered = ideas.filter((i) => IdeaStatusEnum.is.voting(i.status));
      } else if (filter === "rejected") {
        filtered = ideas.filter((i) => IdeaStatusEnum.is.rejected(i.status));
      }
    }
    return [...filtered]
      .sort((a, b) => {
        const scoreA = a.upVotes - a.downVotes;
        const scoreB = b.upVotes - b.downVotes;
        return scoreB - scoreA;
      })
      .slice(0, maxItems);
  }, [ideas, maxItems, filter]);

  const title =
    filter === "approved" || filter === "approved_for_project"
      ? "Approved"
      : filter === "voting"
        ? "Voting"
        : filter === "rejected"
          ? "Rejected"
          : "Ideas";

  const virtualizer = useVirtualizer({
    count: filteredIdeas.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 132,
    overscan: 5,
  });

  const isInitialLoading = !ideasReady && ideas.length === 0;

  const handleVoteClick = useCallback((_: bigint) => {
    setDialogOpen(true);
  }, []);

  const handleIdeaClick = useCallback(
    (id: bigint) => {
      navigate(`/ideas/${id}`);
    },
    [navigate],
  );

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm",
        className,
      )}
    >
      <HumanTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {showHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="text-tiny text-muted-foreground">{filteredIdeas.length}</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto"
      >
        {isInitialLoading ? (
          <IdeasViewSkeleton />
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const idea = filteredIdeas[virtualItem.index];

              return (
                <IdeaRow
                  id={idea.id}
                  key={idea.id.toString()}
                  title={idea.title}
                  description={idea.description}
                  category={idea.category}
                  status={idea.status}
                  approvalThreshold={idea.approvalThreshold}
                  vetoThreshold={idea.vetoThreshold}
                  upVotes={idea.upVotes}
                  downVotes={idea.downVotes}
                  vetoCount={idea.vetoCount}
                  createdBy={idea.createdBy}
                  avatarSeed={avatarSeedByAgentId[idea.createdBy] || idea.createdBy}
                  createdAt={idea.createdAt}
                  index={virtualItem.index}
                  onVoteClick={handleVoteClick}
                  onClick={handleIdeaClick}
                  start={virtualItem.start}
                  measureRef={virtualizer.measureElement}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
