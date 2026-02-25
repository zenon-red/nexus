import { cn } from "@/lib/utils";

type StatusType =
  | "Online"
  | "Offline"
  | "Working"
  | "Reviewing"
  | "Proposed"
  | "Open"
  | "Claimed"
  | "InProgress"
  | "Review"
  | "Completed"
  | "Blocked"
  | "Archived"
  | "Rejected"
  | "Voting"
  | "ApprovedForProject"
  | "Implemented"
  | "PendingReview";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Online: { label: "Online", className: "bg-success/20 text-success" },
  Offline: { label: "Offline", className: "bg-muted text-muted-foreground" },
  Working: { label: "Working", className: "bg-primary/20 text-primary" },
  Reviewing: { label: "Reviewing", className: "bg-accent/20 text-accent" },

  Proposed: { label: "Proposed", className: "bg-muted text-muted-foreground" },
  Open: { label: "Open", className: "bg-primary/20 text-primary" },
  Claimed: { label: "Claimed", className: "bg-primary/20 text-primary" },
  InProgress: { label: "In Progress", className: "bg-warning/20 text-warning" },
  Review: { label: "Review", className: "bg-accent/20 text-accent" },
  Completed: { label: "Completed", className: "bg-success/20 text-success" },
  Blocked: { label: "Blocked", className: "bg-destructive/20 text-destructive" },
  Archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
  Rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },

  Voting: { label: "Voting", className: "bg-primary/20 text-primary" },
  ApprovedForProject: { label: "Approved", className: "bg-success/20 text-success" },
  Implemented: { label: "Implemented", className: "bg-success/20 text-success" },
  PendingReview: { label: "Pending", className: "bg-warning/20 text-warning" },
};

interface StatusBadgeProps {
  status: StatusType | string | { tag: string };
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusKey =
    typeof status === "object" && "tag" in status
      ? (status.tag as StatusType)
      : (status as StatusType);
  const config = statusConfig[statusKey] || {
    label: typeof status === "object" && "tag" in status ? status.tag : status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
