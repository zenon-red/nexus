import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { m, AnimatePresence, type Transition } from "motion/react";
import {
  ArrowLeft,
  Github,
  MessageSquare,
  CircleDot,
  GitPullRequest,
  Lightbulb,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { useProject } from "@/hooks/useProject";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { ZoeCrown } from "@/components/ui/ZoeCrown";
import ElectricBorder from "@/components/ElectricBorder";
import { Checkbox, CheckboxIndicator } from "@/components/animate-ui/primitives/radix/checkbox";
import { HumanTaskDialog } from "@/components/ui/HumanTaskDialog";
import {
  AgentRoleEnum,
  ProjectStatusEnum,
  TaskStatusEnum,
  useConnectionStatus,
  useProjects,
  type TasksRow,
  type AgentsRow,
} from "@/spacetime/hooks";
import { cn } from "@/lib/utils";

type TimestampLike = { microsSinceUnixEpoch: bigint };

function timestampToMillis(ts: TimestampLike | null | undefined): number {
  if (!ts) return 0;
  return Number(ts.microsSinceUnixEpoch / 1000n);
}

function formatClockTime(ts: TimestampLike | null | undefined): string {
  const millis = timestampToMillis(ts);
  if (millis <= 0) return "--:--";
  return new Date(millis).toISOString().slice(11, 16);
}

function formatRelativeTime(ts: TimestampLike | null | undefined): string {
  const millis = timestampToMillis(ts);
  if (millis <= 0) return "--";
  const diffMs = Date.now() - millis;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatRelativeAgo(timestamp: { microsSinceUnixEpoch: bigint }): string {
  const nowMs = Date.now();
  const thenMs = Number(timestamp.microsSinceUnixEpoch / 1000n);
  const diffMs = Math.max(0, nowMs - thenMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs >= day) return `${Math.floor(diffMs / day)}d ago`;
  if (diffMs >= hour) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs >= minute) return `${Math.floor(diffMs / minute)}m ago`;
  return "just now";
}

function formatUptime(ts: TimestampLike | null | undefined): string {
  const millis = timestampToMillis(ts);
  if (millis <= 0) return "--";
  const diffMs = Math.max(0, Date.now() - millis);
  const totalHours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours.toString().padStart(2, "0")}h`;
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

function normalizeRepo(repo: string | null | undefined): { path: string; href: string } | null {
  if (!repo) return null;
  const cleaned = repo
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/^www\.github\.com\//, "")
    .replace(/^\/+/, "");
  if (!cleaned) return null;
  return { path: cleaned, href: `https://github.com/${cleaned}` };
}

function getAgentAvatarSeed(agent: AgentsRow): string {
  return agent.zenonAddress || agent.identity.toHexString();
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
  return (
    <span className={`text-label font-semibold ${colors[tag] ?? "text-muted-foreground"}`}>
      {labels[tag] ?? tag.toUpperCase()}
    </span>
  );
}

const getPathAnimate = (isChecked: boolean) => ({
  pathLength: isChecked ? 1 : 0,
  opacity: isChecked ? 1 : 0,
});
const getPathTransition = (isChecked: boolean): Transition => ({
  pathLength: { duration: 0.6, ease: "easeInOut" },
  opacity: { duration: 0.01, delay: isChecked ? 0 : 0.6 },
});

function AssigneeAvatar({ agent }: { agent?: AgentsRow }) {
  if (!agent) return null;
  return <AlienAvatar seed={getAgentAvatarSeed(agent)} size={14} />;
}

interface TaskRowProps {
  task: TasksRow;
  assignee?: AgentsRow;
  index: number;
  onCardClick: () => void;
  onCheckboxClick: () => void;
}

function TaskRow({ task, assignee, index, onCardClick, onCheckboxClick }: TaskRowProps) {
  const isComplete = TaskStatusEnum.is.completed(task.status);

  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      onClick={onCardClick}
      className="group flex cursor-pointer items-center gap-3 border-b border-border/20 p-3 transition-colors last:border-b-0 hover:bg-surface-elevated/30 sm:gap-5 sm:p-4"
    >
      <m.div
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

      <div className="min-w-0 flex-1">
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
          <span className="ml-auto text-tiny text-muted-foreground">
            {formatTimeAgo(task.updatedAt)}
          </span>
        </div>
      </div>
    </m.div>
  );
}

interface MessageRowProps {
  msg: {
    id: bigint;
    senderId: string;
    senderSeed: string;
    senderName: string;
    content: string;
    createdAt: TimestampLike;
  };
  index: number;
  isZoe: boolean;
}

function MessageRow({ msg, index, isZoe }: MessageRowProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="border-b border-border/20 px-5 py-4 last:border-0"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 pt-2">
          {isZoe && <ZoeCrown />}
          <AlienAvatar seed={msg.senderSeed} size={32} className="mt-0.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{msg.senderName}</span>
            <span className="text-tiny text-muted-foreground">
              {formatClockTime(msg.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{msg.content}</p>
        </div>
      </div>
    </m.div>
  );
}

function InlineStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="mb-1 text-label text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ProjectNotFound() {
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
      <p className="mb-8 text-body text-muted-foreground">Project not found in registry</p>
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/")}
        className="flex items-center justify-center gap-2 rounded-md border border-primary/30 px-6 py-3 text-sm text-primary transition-colors hover:bg-primary/5 hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to dashboard
      </m.button>
    </div>
  );
}

function ProjectLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-sm text-muted-foreground"
      >
        Loading project...
      </m.div>
    </div>
  );
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const liveProject = useProject(id || "");
  const projects = useProjects();
  const isConnected = useConnectionStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notFoundDelayElapsed, setNotFoundDelayElapsed] = useState(false);
  const [dismissedDirectiveId, setDismissedDirectiveId] = useState<string | null>(null);

  useEffect(() => {
    if (liveProject.project || !isConnected || projects.length > 0) {
      setNotFoundDelayElapsed(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotFoundDelayElapsed(true);
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [liveProject.project, isConnected, projects.length, id]);

  const showNotFound =
    !liveProject.project && isConnected && (projects.length > 0 || notFoundDelayElapsed);

  const agentsById = useMemo(() => {
    const map = new Map<string, AgentsRow>();
    for (const agent of liveProject.assignees) {
      map.set(agent.id, agent);
    }
    return map;
  }, [liveProject.assignees]);

  const sortedTasks = useMemo(() => {
    return [...liveProject.tasks].sort(
      (a, b) => Number(b.updatedAt.microsSinceUnixEpoch) - Number(a.updatedAt.microsSinceUnixEpoch),
    );
  }, [liveProject.tasks]);

  const stats = useMemo(() => {
    const total = sortedTasks.length;
    const open = sortedTasks.filter((t) => t.status.tag === "Open").length;
    const inReview = sortedTasks.filter((t) => t.status.tag === "Review").length;
    const completed = sortedTasks.filter((t) => t.status.tag === "Completed").length;
    return { total, open, inReview, completed };
  }, [sortedTasks]);

  const system = useMemo(() => {
    const participants = new Set<string>();
    for (const task of liveProject.tasks) {
      if (task.assignedTo) participants.add(task.assignedTo);
    }
    for (const msg of liveProject.messages) {
      participants.add(msg.senderId);
    }
    const activityTimes = [
      ...liveProject.tasks.map((t) => timestampToMillis(t.updatedAt as TimestampLike)),
      ...liveProject.messages.map((m) => timestampToMillis(m.createdAt as TimestampLike)),
    ].filter((v) => v > 0);
    const lastActivityMillis = activityTimes.length > 0 ? Math.max(...activityTimes) : 0;
    return {
      uptime: formatUptime((liveProject.project?.createdAt as TimestampLike) || null),
      lastActivity:
        lastActivityMillis > 0
          ? formatRelativeTime({ microsSinceUnixEpoch: BigInt(lastActivityMillis) * 1000n })
          : "--",
      agentCount: participants.size,
    };
  }, [liveProject.project, liveProject.tasks, liveProject.messages]);

  const messages = useMemo(() => {
    const projectLogMessages = liveProject.messages.filter(
      (m) => m.messageType.tag !== "Directive",
    );
    const senderNames = liveProject.senders.reduce(
      (acc, s) => {
        acc[s.id] = s.name;
        return acc;
      },
      {} as Record<string, string>,
    );
    const senderSeeds = liveProject.senders.reduce(
      (acc, s) => {
        acc[s.id] = getAgentAvatarSeed(s);
        return acc;
      },
      {} as Record<string, string>,
    );
    return projectLogMessages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderSeed: senderSeeds[m.senderId] || m.senderId,
      senderName: senderNames[m.senderId] || m.senderId,
      content: m.content,
      createdAt: m.createdAt as TimestampLike,
    }));
  }, [liveProject.messages, liveProject.senders]);

  const senderRoles = useMemo(() => {
    const map = new Map<string, AgentsRow["role"]>();
    for (const sender of liveProject.senders) {
      map.set(sender.id, sender.role);
    }
    return map;
  }, [liveProject.senders]);

  const latestProjectDirective = useMemo(() => {
    const directives = liveProject.messages
      .filter((m) => m.messageType.tag === "Directive")
      .sort(
        (a, b) =>
          Number(b.createdAt.microsSinceUnixEpoch) - Number(a.createdAt.microsSinceUnixEpoch),
      );
    return directives[0];
  }, [liveProject.messages]);

  const latestDirectiveId = latestProjectDirective ? latestProjectDirective.id.toString() : null;
  const isDirectiveDismissed = !!latestDirectiveId && dismissedDirectiveId === latestDirectiveId;

  if (!liveProject.project && !showNotFound) {
    return (
      <AppShell>
        <ProjectLoading />
      </AppShell>
    );
  }

  if (!liveProject.project) {
    return (
      <AppShell>
        <ProjectNotFound />
      </AppShell>
    );
  }

  const project = liveProject.project;
  const normalizedRepo = normalizeRepo(project.githubRepo);

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
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </m.button>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">ID: {project.id.toString()}</span>
                  {normalizedRepo && (
                    <>
                      <span className="hidden text-border sm:inline">|</span>
                      <a
                        href={normalizedRepo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 transition-colors hover:text-primary"
                      >
                        <Github className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{normalizedRepo.path}</span>
                      </a>
                    </>
                  )}
                  <span className="hidden text-border sm:inline">|</span>
                  <span className="font-mono">
                    STATUS: {ProjectStatusEnum.display(project.status)}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-8 lg:flex">
              <InlineStat label="Total" value={stats.total} />
              <InlineStat label="Open" value={stats.open} />
              <InlineStat label="In Review" value={stats.inReview} />
              <InlineStat label="Completed" value={stats.completed} />
            </div>
            <div className="hidden items-center gap-6 text-xs md:flex">
              <div className="text-right">
                <div className="text-label text-muted-foreground">Project Age</div>
                <div className="mt-0.5 flex items-center gap-2 text-foreground">
                  <span className="font-mono">{system.uptime}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-label text-muted-foreground">Agents</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-success">{system.agentCount}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
              <div className="grid grid-cols-4 gap-4 lg:hidden">
                <InlineStat label="Total" value={stats.total} />
                <InlineStat label="Open" value={stats.open} />
                <InlineStat label="In Review" value={stats.inReview} />
                <InlineStat label="Completed" value={stats.completed} />
              </div>

              <m.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-md border border-border bg-surface p-6"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-label font-semibold text-muted-foreground">Description</h2>
                  {liveProject.sourceIdea && (
                    <button
                      onClick={() => navigate(`/ideas/${liveProject.sourceIdea!.id}`)}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground"
                    >
                      <span>from</span>
                      <Lightbulb className="h-3.5 w-3.5 text-warning" />
                      <span className="max-w-50 truncate text-warning underline decoration-warning/40 underline-offset-2 transition-colors hover:text-warning/80 hover:decoration-warning/60">
                        {liveProject.sourceIdea.title}
                      </span>
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {project.description || "No description available."}
                </p>
              </m.section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-wider text-foreground uppercase">
                    TASKS
                  </h2>
                </div>
                <div className="overflow-hidden rounded-md border border-border bg-surface">
                  <AnimatePresence>
                    {sortedTasks.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">No tasks yet</div>
                    ) : (
                      sortedTasks.map((task, index) => (
                        <TaskRow
                          key={task.id.toString()}
                          task={task}
                          assignee={task.assignedTo ? agentsById.get(task.assignedTo) : undefined}
                          index={index}
                          onCardClick={() => setDialogOpen(true)}
                          onCheckboxClick={() => setDialogOpen(true)}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <HumanTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            </div>
          </div>

          <aside className="flex max-h-[40vh] w-full shrink-0 flex-col border-t border-border bg-surface lg:max-h-none lg:w-96 lg:border-t-0 lg:border-l">
            <div className="shrink-0 border-b border-border p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-foreground uppercase">
                <MessageSquare className="h-4 w-4" />
                Agent Log
              </h3>
            </div>
            <div className="flex-1 overflow-x-hidden overflow-y-auto">
              {latestProjectDirective && !isDirectiveDismissed && (
                <div className="sticky top-0 z-20 px-5 pt-4 pb-3">
                  <ElectricBorder
                    className="overflow-visible"
                    color="oklch(0.8533 0.214 140.07)"
                    speed={0.6}
                    chaos={0.07}
                    thickness={1}
                    style={{ borderRadius: 16 }}
                  >
                    <div className="relative rounded-[inherit] bg-surface/92 px-6 py-6">
                      <button
                        type="button"
                        onClick={() => setDismissedDirectiveId(latestDirectiveId)}
                        className="absolute top-3 right-4 z-30 cursor-pointer font-mono text-xl leading-none text-slate-300 transition-colors hover:text-white"
                        aria-label="Dismiss directive"
                        title="Dismiss"
                      >
                        ×
                      </button>
                      <p className="mb-4 text-[15px] leading-7 text-slate-300">
                        {latestProjectDirective.content}
                      </p>
                      <div className="flex items-center justify-between font-mono text-xs text-slate-500">
                        <span className="rounded-sm border border-primary/45 bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
                          Directive
                        </span>
                        <span>
                          — ZŌE,{" "}
                          {formatRelativeAgo(latestProjectDirective.createdAt as TimestampLike)}
                        </span>
                      </div>
                    </div>
                  </ElectricBorder>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg, index) => {
                  const senderRole = senderRoles.get(msg.senderId);
                  const isZoe =
                    msg.senderId === "zr-zoe" || (!!senderRole && AgentRoleEnum.is.zoe(senderRole));
                  return (
                    <MessageRow key={msg.id.toString()} msg={msg} index={index} isZoe={isZoe} />
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="shrink-0 border-t border-border bg-surface-elevated/30 p-4">
              <div className="flex items-center justify-between font-mono text-tiny text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Connected
                </span>
                <span>Last active: {system.lastActivity}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
