import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { m } from "motion/react";
import { AppShell } from "@/components/layout";
import { ActivityFeed } from "@/components/domain";
import { ArrowLeft } from "lucide-react";

function formatTimeAgo(micros: number | null): string {
  if (!micros) return "--";
  const seconds = Number(BigInt(micros) / 1000000n);
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityPage() {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<number | null>(null);

  const handleLastActivityChange = useCallback((timestamp: number | null) => {
    setLastActivity(timestamp);
  }, []);

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
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Activity</h1>
              </div>
            </div>

            <div className="hidden items-center gap-6 text-xs md:flex">
              <div className="text-right">
                <div className="text-label text-muted-foreground">Last Activity</div>
                <div className="mt-0.5 font-mono text-foreground">
                  {formatTimeAgo(lastActivity)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden p-4 lg:p-6">
          <div className="mx-auto h-full max-w-4xl">
            <ActivityFeed
              className="h-full"
              maxItems={100}
              onLastActivityChange={handleLastActivityChange}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
