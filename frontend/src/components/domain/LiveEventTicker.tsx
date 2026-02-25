import { useMemo } from "react";
import { useNavigate } from "react-router";
import { m, AnimatePresence } from "motion/react";
import {
  useMessages,
  useProjectMessages,
  useVotes,
  useTasks,
  useIdeas,
  useProjects,
  TaskStatusEnum,
  VoteTypeEnum,
} from "@/spacetime/hooks";
import { cn } from "@/lib/utils";
import { MessageSquare, ThumbsUp, ThumbsDown, GitMerge, Lightbulb } from "lucide-react";

type EventType = "message" | "project_message" | "vote_up" | "vote_down" | "task" | "idea";

interface Event {
  id: string;
  type: EventType;
  title: string;
  actor?: string;
  timestamp: number;
  projectName?: string;
}

const eventConfig: Record<EventType, { icon: React.ElementType; color: string }> = {
  message: { icon: MessageSquare, color: "text-primary" },
  project_message: { icon: MessageSquare, color: "text-purple-400" },
  vote_up: { icon: ThumbsUp, color: "text-success" },
  vote_down: { icon: ThumbsDown, color: "text-destructive" },
  task: { icon: GitMerge, color: "text-purple-400" },
  idea: { icon: Lightbulb, color: "text-warning" },
};

function findLatest<T>(items: T[], toEvent: (item: T) => Event | null): Event | null {
  if (items.length === 0) return null;

  let latest: Event | null = null;

  for (const item of items) {
    const event = toEvent(item);
    if (event && (!latest || event.timestamp > latest.timestamp)) {
      latest = event;
    }
  }

  return latest;
}

export function LiveEventTicker() {
  const navigate = useNavigate();
  const messages = useMessages();
  const projectMessages = useProjectMessages();
  const projects = useProjects();
  const votes = useVotes();
  const tasks = useTasks();
  const ideas = useIdeas();

  const projectNames = useMemo(() => {
    const names: Record<string, string> = {};
    projects.forEach((project) => {
      names[project.id.toString()] = project.name;
    });
    return names;
  }, [projects]);

  const latestEvent = useMemo((): Event | null => {
    const candidates: Event[] = [];

    const latestMessage = findLatest(messages, (msg) => ({
      id: `msg-${msg.id}`,
      type: "message" as EventType,
      title: msg.content.slice(0, 60),
      actor: msg.senderId,
      timestamp: Number(msg.createdAt.microsSinceUnixEpoch),
    }));
    if (latestMessage) candidates.push(latestMessage);

    const latestProjectMessage = findLatest(projectMessages, (msg) => ({
      id: `pmsg-${msg.id}`,
      type: "project_message" as EventType,
      title: `[${projectNames[msg.projectId.toString()] || `Project ${msg.projectId}`}] ${msg.content.slice(0, 40)}`,
      actor: msg.senderId,
      timestamp: Number(msg.createdAt.microsSinceUnixEpoch),
      projectName: projectNames[msg.projectId.toString()],
    }));
    if (latestProjectMessage) candidates.push(latestProjectMessage);

    const latestVote = findLatest(votes, (vote) => ({
      id: `vote-${vote.id}`,
      type: (VoteTypeEnum.is.up(vote.voteType) ? "vote_up" : "vote_down") as EventType,
      title: `voted ${VoteTypeEnum.display(vote.voteType)}`,
      actor: vote.agentId,
      timestamp: Number(vote.createdAt.microsSinceUnixEpoch),
    }));
    if (latestVote) candidates.push(latestVote);

    const latestTask = findLatest(tasks, (task) => ({
      id: `task-${task.id}`,
      type: "task" as EventType,
      title: `${TaskStatusEnum.display(task.status)}: #${task.id} by ${task.assignedTo || "unassigned"}`,
      timestamp: Number(task.updatedAt.microsSinceUnixEpoch),
    }));
    if (latestTask) candidates.push(latestTask);

    const latestIdea = findLatest(ideas, (idea) => ({
      id: `idea-${idea.id}`,
      type: "idea" as EventType,
      title: `${idea.status.tag}: ${idea.title}`,
      actor: idea.createdBy,
      timestamp: Number(idea.updatedAt.microsSinceUnixEpoch),
    }));
    if (latestIdea) candidates.push(latestIdea);

    if (candidates.length === 0) return null;

    return candidates.reduce((max, curr) => (curr.timestamp > max.timestamp ? curr : max));
  }, [messages, projectMessages, votes, tasks, ideas, projectNames]);

  if (!latestEvent) {
    return <div className="h-4" aria-hidden="true" />;
  }

  const config = eventConfig[latestEvent.type];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={latestEvent.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{
          duration: 0.1,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="flex h-4 max-w-full cursor-pointer items-center gap-1.5 font-mono text-tiny transition-opacity hover:opacity-80 sm:gap-2"
        onClick={() => navigate("/activity")}
      >
        <span className="hidden shrink-0 text-foreground/55 lg:inline">SYSTEM</span>
        <Icon className={cn("size-3.5 shrink-0", config.color)} />
        <span className="max-w-[70vw] truncate font-medium text-foreground sm:max-w-140">
          {latestEvent.title}
        </span>
        <>
          <span className="hidden text-foreground/35 lg:inline">//</span>
          <span className="hidden text-foreground/45 uppercase lg:inline">
            {latestEvent.type.replace("_", " ")}
          </span>
        </>
      </m.div>
    </AnimatePresence>
  );
}
