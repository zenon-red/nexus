"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { m, type Transition } from "motion/react";
import {
  useTasksSnapshot,
  useProjectsSnapshot,
  useAgentsSnapshot,
  TaskStatusEnum,
  ProjectStatusEnum,
  type TasksRow,
  type AgentsRow,
  type ProjectStatus,
  mapAgentsById,
} from "@/spacetime/hooks";
import { cn } from "@/lib/utils";
import { HumanTaskDialog } from "@/components/ui/HumanTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox, CheckboxIndicator } from "@/components/animate-ui/primitives/radix/checkbox";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/animate-ui/components/radix/accordion";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { CircleDot, Github, GitPullRequest } from "lucide-react";

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});

const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 0.6, ease: "easeInOut" },
  opacity: {
    duration: 0.01,
    delay: isChecked ? 0 : 0.6,
  },
});

const AVATAR_COLORS = [
  "#78ef5d", // Green
  "#5bbdda", // Cyan
  "#d1a84b", // Yellow
  "#ff406e", // Red
  "#8b31ff", // Purple
];

function getStripeColor(index: number, prevColor: string | null): string {
  const available = AVATAR_COLORS.filter((c) => c !== prevColor);
  return available[index % available.length];
}

function formatTimeAgo(timestamp: { microsSinceUnixEpoch: bigint }): string {
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

function StatusBadge({ status }: { status: TasksRow["status"] }) {
  const colors: Record<string, string> = {
    Open: "text-muted-foreground",
    Claimed: "text-info",
    InProgress: "text-warning",
    Review: "text-accent",
    Completed: "text-success",
    Blocked: "text-destructive",
  };

  const labels: Record<string, string> = {
    Open: "OPEN",
    Claimed: "CLAIMED",
    InProgress: "IN PROGRESS",
    Review: "REVIEW",
    Completed: "COMPLETED",
    Blocked: "BLOCKED",
  };

  const tag = status.tag;
  const color = colors[tag] ?? "text-muted-foreground";
  const label = labels[tag] ?? tag.toUpperCase();

  return <span className={`text-label font-semibold ${color}`}>{label}</span>;
}

function AssigneeAvatar({ agent }: { agent?: AgentsRow }) {
  if (!agent) return null;
  return <AlienAvatar seed={agent.zenonAddress || agent.identity.toHexString()} size={14} />;
}

interface TaskRowProps {
  task: TasksRow;
  assignee?: AgentsRow;
  index: number;
  onCardClick: (projectId: bigint) => void;
  onCheckboxClick: () => void;
}

const TaskRow = memo(function TaskRow({
  task,
  assignee,
  index,
  onCardClick,
  onCheckboxClick,
}: TaskRowProps) {
  const isComplete = TaskStatusEnum.is.completed(task.status);

  return (
    <m.div
      initial={{ x: -10 }}
      animate={{ x: 0 }}
      transition={{ delay: 0.35 + index * 0.05, duration: 0.15 }}
      onClick={() => onCardClick(task.projectId)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 sm:gap-5 sm:p-4"
    >
      <m.div
        initial={{ x: -8 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.4 + index * 0.07, duration: 0.15 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCheckboxClick();
        }}
        className="flex cursor-pointer items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Checkbox
          id={`task-${task.id}`}
          checked={isComplete}
          disabled
          className="pointer-events-none flex h-5 w-5 items-center justify-center rounded border-2 border-border data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-black"
        >
          <CheckboxIndicator className="h-3.5 w-3.5 text-black" />
        </Checkbox>
      </m.div>

      <m.div
        initial={{ x: -8 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.45 + index * 0.07, duration: 0.15 }}
        className="min-w-0 flex-1"
      >
        <div className="relative inline-block">
          <span
            className={cn(
              "text-sm leading-relaxed font-medium text-foreground",
              isComplete && "text-muted-foreground",
            )}
          >
            {task.title}
          </span>
          <m.svg
            width="100%"
            height="24"
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
            className="pointer-events-none absolute top-1/2 left-0 z-20 h-6 w-full -translate-y-1/2"
          >
            <m.path
              d="M 0 12 s 100 -8 200 -8 c 50 0 -20 8 0 16 c 15 5 120 -20 200 -16"
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              strokeLinecap="round"
              strokeMiterlimit={10}
              fill="none"
              initial={false}
              animate={getPathAnimate(isComplete)}
              transition={getPathTransition(isComplete)}
              className="stroke-foreground"
            />
          </m.svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StatusBadge status={task.status} />

          <span className="text-label text-muted-foreground">P{task.priority}</span>

          <span className="text-label text-muted-foreground">R{task.reviewCount}</span>

          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <AssigneeAvatar agent={assignee} />
              <span className="text-tiny text-muted-foreground">
                @{task.assignedTo?.toLowerCase().slice(0, 6)}
              </span>
            </div>
          ) : (
            <span className="text-tiny text-muted-foreground/50">[unassigned]</span>
          )}

          {(task.githubIssueUrl || task.githubPrUrl) && (
            <div className="flex items-center gap-2">
              {task.githubIssueUrl && (
                <a
                  href={task.githubIssueUrl}
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
              {task.githubPrUrl && (
                <a
                  href={task.githubPrUrl}
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

          <span className="ml-auto text-tiny text-muted-foreground">
            {formatTimeAgo(task.updatedAt)}
          </span>
        </div>
      </m.div>
    </m.div>
  );
});

interface TaskBoardProps {
  className?: string;
  maxItems?: number;
  showInnerTexture?: boolean;
}

function TaskBoardSkeleton() {
  const skeletonTone = "bg-muted/40";

  return (
    <div className="space-y-2 px-2 py-2">
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div
          key={groupIndex}
          className={cn(
            "rounded-md px-2",
            groupIndex % 2 === 0 ? "bg-surface" : "bg-surface-elevated",
          )}
        >
          <div className="rounded-sm bg-surface-elevated/35 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className={cn("h-4 w-28", skeletonTone)} />
              <Skeleton className={cn("h-3 w-16", skeletonTone)} />
            </div>
          </div>
          <div className="space-y-2 px-3 pb-3">
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <Skeleton className={cn("h-5 w-5 rounded-sm", skeletonTone)} />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className={cn("h-4 w-[70%]", skeletonTone)} />
                  <div className="flex items-center gap-2">
                    <Skeleton className={cn("h-3 w-16", skeletonTone)} />
                    <Skeleton className={cn("h-3 w-8", skeletonTone)} />
                    <Skeleton className={cn("h-3 w-14", skeletonTone)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskBoard({ className, maxItems = 50, showInnerTexture = false }: TaskBoardProps) {
  const navigate = useNavigate();
  const { rows: tasks, isReady: tasksReady } = useTasksSnapshot();
  const { rows: projects } = useProjectsSnapshot();
  const { rows: agents } = useAgentsSnapshot();
  const [dialogOpen, setDialogOpen] = useState(false);

  const projectsById = useMemo(() => {
    const map = new Map<
      bigint,
      { id: bigint; name: string; githubRepo: string; status: ProjectStatus }
    >();
    for (const project of projects) {
      map.set(project.id, {
        id: project.id,
        name: project.name,
        githubRepo: project.githubRepo,
        status: project.status,
      });
    }
    return map;
  }, [projects]);

  const agentsById = useMemo(() => {
    return mapAgentsById(agents);
  }, [agents]);

  const handleCardClick = useCallback(
    (projectId: bigint) => {
      navigate(`/projects/${projectId.toString()}`);
    },
    [navigate],
  );

  const handleCheckboxClick = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const groupedTasks = useMemo(() => {
    const statusOrder: Record<string, number> = {
      InProgress: 0,
      Review: 1,
      Claimed: 2,
      Open: 3,
      Completed: 4,
      Blocked: 5,
    };

    const sliced = [...tasks]
      .sort(
        (a, b) =>
          Number(b.updatedAt.microsSinceUnixEpoch) - Number(a.updatedAt.microsSinceUnixEpoch),
      )
      .slice(0, maxItems);

    const grouped = new Map<bigint, TasksRow[]>();
    for (const task of sliced) {
      const bucket = grouped.get(task.projectId) ?? [];
      bucket.push(task);
      grouped.set(task.projectId, bucket);
    }

    return [...grouped.entries()]
      .map(([projectId, projectTasks]) => ({
        projectId,
        project: projectsById.get(projectId),
        tasks: projectTasks.sort((a, b) => {
          const aOrder = statusOrder[a.status.tag] ?? 99;
          const bOrder = statusOrder[b.status.tag] ?? 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (
            Number(b.updatedAt.microsSinceUnixEpoch) - Number(a.updatedAt.microsSinceUnixEpoch)
          );
        }),
      }))
      .sort((a, b) => {
        const an = a.project?.name ?? a.projectId.toString();
        const bn = b.project?.name ?? b.projectId.toString();
        return an.localeCompare(bn);
      });
  }, [tasks, projectsById, maxItems]);

  const openProjects = useMemo(
    () => groupedTasks.map((group) => group.projectId.toString()),
    [groupedTasks],
  );

  const stripeColors = useMemo(() => {
    const colors: string[] = [];
    let prevColor: string | null = null;
    for (let i = 0; i < groupedTasks.length; i++) {
      const color = getStripeColor(i, prevColor);
      colors.push(color);
      prevColor = color;
    }
    return colors;
  }, [groupedTasks.length]);

  const isInitialLoading = !tasksReady && tasks.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm",
        className,
      )}
    >
      <HumanTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="relative">
          {isInitialLoading ? (
            <TaskBoardSkeleton />
          ) : groupedTasks.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
              <span className="font-mono text-sm">[no tasks]</span>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={openProjects} className="py-2">
              {groupedTasks.map((group, groupIndex) => (
                <div key={group.projectId.toString()}>
                  <div
                    className={cn(
                      "px-2",
                      groupIndex % 2 === 0 ? "bg-surface" : "bg-surface-elevated",
                      groupIndex === 0 ? "rounded-t-md" : "",
                      groupIndex === groupedTasks.length - 1 ? "rounded-b-md" : "",
                    )}
                  >
                    <AccordionItem
                      value={group.projectId.toString()}
                      className="border-b border-border/20 last:border-b-0"
                    >
                      <AccordionTrigger className="bg-surface-elevated/35 px-3 py-3 hover:bg-surface-elevated/50 hover:no-underline">
                        <div className="flex w-full items-center justify-between pr-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold tracking-wider text-foreground/90 uppercase">
                              #{group.projectId.toString()}
                            </span>
                            {group.project?.githubRepo && (
                              <div className="flex items-center gap-1 font-mono text-tiny text-primary">
                                <Github className="size-3 shrink-0" />
                                <span>
                                  {group.project.githubRepo
                                    .replace("github.com/", "")
                                    .toLowerCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-tiny text-muted-foreground uppercase">
                            {group.tasks.length} tasks
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 sm:pb-4">
                        <div className="flex py-1">
                          <div className="sticky top-0 flex shrink-0 flex-col self-start">
                            {group.project?.status && (
                              <div className="px-1">
                                <span className="rotate-180 font-mono text-tiny font-black tracking-[0.3em] text-muted-foreground uppercase opacity-70 [writing-mode:vertical-rl]">
                                  {ProjectStatusEnum.display(group.project.status)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="mr-2 ml-3 flex-1 space-y-0 pl-1 sm:mr-6 sm:ml-6 lg:mr-12 lg:ml-8">
                            {group.tasks.map((task, index) => (
                              <div key={task.id.toString()}>
                                <TaskRow
                                  task={task}
                                  assignee={
                                    task.assignedTo ? agentsById.get(task.assignedTo) : undefined
                                  }
                                  index={index}
                                  onCheckboxClick={handleCheckboxClick}
                                  onCardClick={handleCardClick}
                                />
                                {index < group.tasks.length - 1 && (
                                  <div
                                    className="my-0.5 h-1 w-full rounded-sm sm:my-1 sm:h-2"
                                    style={
                                      showInnerTexture
                                        ? {
                                            backgroundImage:
                                              "repeating-linear-gradient(-45deg, transparent 0px, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 7px)",
                                          }
                                        : undefined
                                    }
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                  {groupIndex < groupedTasks.length - 1 && (
                    <div
                      className="h-2"
                      style={{
                        background: `repeating-linear-gradient(-45deg, ${stripeColors[groupIndex]}90 0, ${stripeColors[groupIndex]}90 1px, transparent 0, transparent 5px)`,
                      }}
                    />
                  )}
                </div>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
