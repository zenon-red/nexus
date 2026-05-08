import { AppShell } from "@/components/layout";
import { TaskBoard, IdeasView, TalkingHead } from "@/components/domain";
import { MessageFeed } from "@/components/domain/MessageFeed";
import { LiveEventTicker } from "@/components/domain/LiveEventTicker";
import { VoiceAnnouncer, type VoiceAnnouncerState } from "@/components/domain/VoiceAnnouncer";
import { MatrixGrid } from "@/components/ui/MatrixGrid";
import { useNavigate } from "react-router";
import { m } from "motion/react";
import { useState, useCallback } from "react";
import { useIdeas, useTasks, useProjects } from "@/spacetime/hooks";
import { ArrowUpRight, Wifi, Play, Pause } from "lucide-react";

function TerminalStatsBar() {
  const ideas = useIdeas();
  const tasks = useTasks();
  const projects = useProjects();

  return (
    <div className="flex h-7 items-center gap-2 border-t border-border bg-surface px-2 font-mono text-tiny whitespace-nowrap sm:h-8 sm:gap-6 sm:px-4">
      <div className="flex items-center gap-1 text-muted-foreground sm:gap-2">
        <span className="text-muted-foreground">IDEAS</span>
        <span className="font-semibold text-foreground">{ideas.length}</span>
      </div>
      <div className="h-3 w-px bg-border sm:h-4" />
      <div className="flex items-center gap-1 text-muted-foreground sm:gap-2">
        <span className="text-muted-foreground">PROJECTS</span>
        <span className="font-semibold text-foreground">{projects.length}</span>
      </div>
      <div className="h-3 w-px bg-border sm:h-4" />
      <div className="flex items-center gap-1 text-muted-foreground sm:gap-2">
        <span className="text-muted-foreground">TASKS</span>
        <span className="font-semibold text-foreground">{tasks.length}</span>
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <span className="flex items-center gap-1 text-success">
          <Wifi className="size-3 sm:size-3.5" />
          <span>ONLINE</span>
        </span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [activeChatChannel, setActiveChatChannel] = useState("general");
  const [voiceState, setVoiceState] = useState<VoiceAnnouncerState | null>(null);
  const [voiceLevels, setVoiceLevels] = useState<number[] | undefined>(undefined);

  const handleVoiceStateChange = useCallback((state: VoiceAnnouncerState) => {
    setVoiceState(state);
  }, []);

  const handleVoiceLevelsChange = useCallback((levels: number[]) => {
    setVoiceLevels(levels);
  }, []);

  return (
    <AppShell>
      <div className="flex h-screen flex-col bg-background">
        <VoiceAnnouncer
          onStateChange={handleVoiceStateChange}
          onLevelsChange={handleVoiceLevelsChange}
        />
        <header className="shrink-0 border-b border-border bg-surface">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-3">
            <div className="justify-self-start" />
            <div className="justify-self-center">
              <LiveEventTicker />
            </div>
            <div aria-hidden className="justify-self-end" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:overflow-hidden">
          <div className="grid grid-cols-1 gap-4 lg:h-full lg:grid-cols-3">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="order-2 flex max-h-[58vh] min-h-105 flex-col lg:order-1 lg:max-h-none lg:min-h-0"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
                  Ideas
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/ideas")}
                  className="flex cursor-pointer items-center gap-1 font-mono text-label text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>View All</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
              <IdeasView
                className="max-h-[calc(58vh-2rem)] min-h-85 flex-1 border border-border/50 lg:max-h-none lg:min-h-0"
                maxItems={30}
                filter="voting"
              />
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="order-1 flex min-h-140 flex-col lg:order-2 lg:min-h-0"
            >
              <div className="relative h-[33vh] max-h-100 min-h-70 w-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-20">
                  <MatrixGrid
                    className="h-full w-full"
                    forcedMode={
                      voiceState?.isPlaying
                        ? "vu"
                        : activeChatChannel === "zoe"
                          ? "omacron"
                          : undefined
                    }
                    levels={voiceState?.isPlaying ? voiceLevels : undefined}
                  />
                </div>
                <div className="relative z-10 flex h-full items-end justify-center">
                  <TalkingHead showWordmark />
                </div>
              </div>
              <div className="relative mx-auto flex h-[62vh] max-h-[62vh] min-h-85 w-full max-w-2xl flex-col lg:h-auto lg:max-h-none lg:min-h-0 lg:flex-1">
                {voiceState?.isPlaying && (
                  <button
                    type="button"
                    onClick={() => voiceState.pauseVoice()}
                    className="absolute -top-10 left-0 z-30 inline-flex items-center gap-1.5 rounded-md bg-red-900 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-red-800"
                    aria-label="Pause voice"
                  >
                    <Pause className="size-4" />
                    Pause Voice
                  </button>
                )}
                {!voiceState?.isPlaying && voiceState?.autoplayBlocked && (
                  <button
                    type="button"
                    onClick={() => voiceState.enableVoice()}
                    className="absolute -top-10 left-0 z-30 inline-flex items-center gap-1.5 rounded-md bg-red-900 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-red-800"
                  >
                    <Play className="size-4" />
                    Enable Voice
                  </button>
                )}
                <MessageFeed className="h-full" onActiveChannelChange={setActiveChatChannel} />
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="order-3 flex max-h-[58vh] min-h-105 flex-col lg:max-h-none lg:min-h-0"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
                  PROJECTS
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/tasks")}
                  className="flex cursor-pointer items-center gap-1 font-mono text-label text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>View All</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
              <TaskBoard
                className="max-h-[calc(58vh-2rem)] min-h-85 flex-1 border border-border/50 lg:max-h-none lg:min-h-0"
                maxItems={50}
                showInnerTexture
              />
            </m.div>
          </div>
        </div>

        <TerminalStatsBar />
      </div>
    </AppShell>
  );
}
