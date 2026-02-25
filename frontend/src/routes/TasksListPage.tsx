import { useNavigate } from "react-router";
import { m } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TaskBoard } from "@/components/domain";
import { useTasks, TaskStatusEnum } from "@/spacetime/hooks";

function getLatestTaskTime(tasks: { createdAt: { microsSinceUnixEpoch: bigint } }[]) {
  if (tasks.length === 0) return null;
  return tasks.reduce((latest, task) =>
    Number(task.createdAt.microsSinceUnixEpoch) > Number(latest.createdAt.microsSinceUnixEpoch)
      ? task
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

export function TasksListPage() {
  const navigate = useNavigate();
  const tasks = useTasks();

  const stats = {
    claimed: tasks.filter(
      (t) =>
        TaskStatusEnum.is.claimed(t.status) ||
        TaskStatusEnum.is.inProgress(t.status) ||
        TaskStatusEnum.is.review(t.status),
    ).length,
    completed: tasks.filter((t) => TaskStatusEnum.is.completed(t.status)).length,
    blocked: tasks.filter((t) => TaskStatusEnum.is.blocked(t.status)).length,
    open: tasks.filter((t) => TaskStatusEnum.is.open(t.status)).length,
  };

  const latestTask = getLatestTaskTime(tasks);

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
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Tasks</h1>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  {tasks.length} all-time
                  <span className="text-border">|</span>
                  <span>
                    {stats.open} <span className="text-primary">[OPEN]</span> for claim
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-6 text-xs md:flex">
              <div className="text-right">
                <div className="text-label text-muted-foreground">Last Task</div>
                <div className="mt-0.5 flex items-center gap-2 text-foreground">
                  <span className="font-mono">
                    {latestTask ? formatTimeSince(latestTask.createdAt) : "none"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-4 lg:p-6">
          <div className="mx-auto h-full max-w-4xl">
            <TaskBoard className="h-full" maxItems={tasks.length || 1} showInnerTexture />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
