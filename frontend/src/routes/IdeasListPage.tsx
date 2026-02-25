import { useNavigate } from "react-router";
import { m } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { IdeasView } from "@/components/domain";
import { useIdeas, IdeaStatusEnum } from "@/spacetime/hooks";

function getLatestIdeaTime(ideas: { createdAt: { microsSinceUnixEpoch: bigint } }[]) {
  if (ideas.length === 0) return null;
  return ideas.reduce((latest, idea) =>
    Number(idea.createdAt.microsSinceUnixEpoch) > Number(latest.createdAt.microsSinceUnixEpoch)
      ? idea
      : latest,
  );
}

function formatTimeSince(timestamp: { microsSinceUnixEpoch: bigint }): string {
  const now = Date.now();
  const then = Number(timestamp.microsSinceUnixEpoch / 1000n);
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

export function IdeasListPage() {
  const navigate = useNavigate();
  const ideas = useIdeas();

  const stats = {
    approved: ideas.filter((i) => IdeaStatusEnum.is.approved(i.status)).length,
    implemented: ideas.filter((i) => IdeaStatusEnum.is.implemented(i.status)).length,
    rejected: ideas.filter((i) => IdeaStatusEnum.is.rejected(i.status)).length,
    voting: ideas.filter((i) => IdeaStatusEnum.is.voting(i.status)).length,
  };

  const latestIdea = getLatestIdeaTime(ideas);

  return (
    <AppShell>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="shrink-0 border-b border-border bg-surface">
          <div className="flex items-center justify-between px-6 py-5 lg:px-8">
            <div className="flex items-center gap-5">
              <m.button
                onClick={() => navigate("/")}
                className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-elevated transition-all hover:border-primary/50 hover:bg-surface-overlay"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                title="Back to dashboard"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </m.button>

              <div className="hidden h-8 w-px bg-border sm:block" />

              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Ideas</h1>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:flex sm:items-center sm:gap-2 sm:text-xs">
                  {ideas.length} all-time
                  <span className="hidden text-border sm:inline">|</span>
                  <span>{stats.approved} approved</span>
                  <span className="hidden text-border sm:inline">|</span>
                  <span>{stats.implemented} implemented</span>
                  <span className="hidden text-border sm:inline">|</span>
                  <span>{stats.rejected} rejected</span>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-6 text-xs md:flex">
              <div className="text-right">
                <div className="text-label text-muted-foreground">Last Idea</div>
                <div className="mt-0.5 flex items-center gap-2 text-foreground">
                  <span className="font-mono">
                    {latestIdea ? formatTimeSince(latestIdea.createdAt) : "none"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-4 lg:p-6">
          <div className="mx-auto h-full max-w-4xl">
            <div className="mb-3 flex items-center justify-end">
              <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                {stats.voting} in <span className="text-primary">[VOTING]</span> phase
              </span>
            </div>
            <IdeasView className="h-full" maxItems={ideas.length || 1} filter="all" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
