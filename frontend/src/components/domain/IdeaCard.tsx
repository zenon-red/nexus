import { useNavigate } from "react-router";
import { m, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IdeasRow } from "@/spacetime/hooks";

interface IdeaCardProps {
  idea: IdeasRow;
  index?: number;
  className?: string;
}

export function IdeaCard({ idea, index = 0, className }: IdeaCardProps) {
  const navigate = useNavigate();

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      onClick={() => navigate(`/ideas/${idea.id}`)}
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "cursor-pointer transition-colors",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-4">
        <h3 className="line-clamp-1 font-medium text-foreground">{idea.title}</h3>
        <StatusBadge status={idea.status} />
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{idea.description}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary/50 px-2 py-0.5">{idea.category}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1",
              idea.upVotes - idea.downVotes > 0 && "text-success",
              idea.upVotes - idea.downVotes < 0 && "text-destructive",
            )}
          >
            {idea.upVotes - idea.downVotes > 0 ? "+" : ""}
            {idea.upVotes - idea.downVotes}
          </span>
          {idea.vetoCount >= idea.vetoThreshold && <span className="text-destructive">Vetoed</span>}
        </div>
      </div>
    </m.div>
  );
}

interface IdeasGridProps {
  ideas: IdeasRow[];
  className?: string;
}

export function IdeasGrid({ ideas, className }: IdeasGridProps) {
  const sortedIdeas = [...ideas].sort(
    (a, b) => Number(b.createdAt.microsSinceUnixEpoch) - Number(a.createdAt.microsSinceUnixEpoch),
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ideas</h2>
        <span className="text-sm text-muted-foreground">{ideas.length} total</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {sortedIdeas.map((idea, index) => (
            <IdeaCard key={idea.id} idea={idea} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {ideas.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">[no ideas yet]</div>
      )}
    </div>
  );
}
