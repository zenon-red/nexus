import { useEffect, useMemo, useState } from "react";
import { useTable, useSpacetimeDB } from "spacetimedb/react";
import { tables } from "@/spacetime/generated";
import type {
  Agent,
  AgentRole,
  AgentStatus,
  Channel,
  DiscoveredTask,
  Idea,
  IdeaStatus,
  IdentityRole,
  Message,
  MessageType,
  Project,
  ProjectChannel,
  ProjectMessage,
  ProjectStatus,
  Task,
  TaskStatus,
  Vote,
  VoteType,
} from "@/spacetime/generated/types";

export type {
  Idea as IdeasRow,
  Task as TasksRow,
  Agent as AgentsRow,
  Channel as ChannelsRow,
  Message as MessagesRow,
  Project as ProjectsRow,
  Vote as VotesRow,
  IdentityRole as IdentityRolesRow,
  DiscoveredTask as DiscoveredTasksRow,
  ProjectChannel as ProjectChannelsRow,
  ProjectMessage as ProjectMessagesRow,
};

export type {
  TaskStatus,
  IdeaStatus,
  VoteType,
  AgentRole,
  AgentStatus,
  MessageType,
  ProjectStatus,
};

export function useIdeas() {
  const [rows] = useTable(tables.ideas);
  return useMemo(() => [...rows] as Idea[], [rows]);
}

export function useIdeasSnapshot() {
  const [rows, isReady] = useTable(tables.ideas);
  const data = useMemo(() => [...rows] as Idea[], [rows]);
  return { rows: data, isReady };
}

export function useTasks() {
  const [rows] = useTable(tables.tasks);
  return useMemo(() => [...rows] as Task[], [rows]);
}

export function useTasksSnapshot() {
  const [rows, isReady] = useTable(tables.tasks);
  const data = useMemo(() => [...rows] as Task[], [rows]);
  return { rows: data, isReady };
}

export function useAgents() {
  const [rows] = useTable(tables.agents);
  return useMemo(() => [...rows] as Agent[], [rows]);
}

export function useAgentsSnapshot() {
  const [rows, isReady] = useTable(tables.agents);
  const data = useMemo(() => [...rows] as Agent[], [rows]);
  return { rows: data, isReady };
}

export function useChannels() {
  const [rows] = useTable(tables.channels);
  return useMemo(() => [...rows] as Channel[], [rows]);
}

export function useChannelsSnapshot() {
  const [rows, isReady] = useTable(tables.channels);
  const data = useMemo(() => [...rows] as Channel[], [rows]);
  return { rows: data, isReady };
}

export function useMessages() {
  const [rows] = useTable(tables.messages);
  return useMemo(() => [...rows] as Message[], [rows]);
}

export function useMessagesSnapshot() {
  const [rows, isReady] = useTable(tables.messages);
  const data = useMemo(() => [...rows] as Message[], [rows]);
  return { rows: data, isReady };
}

export function useProjects() {
  const [rows] = useTable(tables.projects);
  return useMemo(() => [...rows] as Project[], [rows]);
}

export function useProjectsSnapshot() {
  const [rows, isReady] = useTable(tables.projects);
  const data = useMemo(() => [...rows] as Project[], [rows]);
  return { rows: data, isReady };
}

export function useVotes() {
  const [rows] = useTable(tables.votes);
  return useMemo(() => [...rows] as Vote[], [rows]);
}

export function useIdentityRoles() {
  const [rows] = useTable(tables.identity_roles);
  return useMemo(() => [...rows] as IdentityRole[], [rows]);
}

export function useDiscoveredTasks() {
  const [rows] = useTable(tables.discovered_tasks);
  return useMemo(() => [...rows] as DiscoveredTask[], [rows]);
}

export function useProjectChannels() {
  const [rows] = useTable(tables.project_channels);
  return useMemo(() => [...rows] as ProjectChannel[], [rows]);
}

export function useProjectMessages() {
  const [rows] = useTable(tables.project_messages);
  return useMemo(() => [...rows] as ProjectMessage[], [rows]);
}

export function useConnectionStatus() {
  const db = useSpacetimeDB();
  return db.isActive;
}

export const TaskStatusEnum = {
  values: ["Open", "Claimed", "InProgress", "Review", "Completed", "Blocked", "Archived"] as const,

  is: {
    open: (s: TaskStatus) => s.tag === "Open",
    claimed: (s: TaskStatus) => s.tag === "Claimed",
    inProgress: (s: TaskStatus) => s.tag === "InProgress",
    review: (s: TaskStatus) => s.tag === "Review",
    completed: (s: TaskStatus) => s.tag === "Completed",
    blocked: (s: TaskStatus) => s.tag === "Blocked",
    archived: (s: TaskStatus) => s.tag === "Archived",
    active: (s: TaskStatus) => ["Open", "Claimed", "InProgress", "Review"].includes(s.tag),
    terminal: (s: TaskStatus) => ["Completed", "Blocked", "Archived"].includes(s.tag),
  },

  display(s: TaskStatus): string {
    const map: Record<string, string> = { Open: "OPEN", InProgress: "IN PROGRESS" };
    return map[s.tag] ?? s.tag.toUpperCase();
  },
} as const;

export const IdeaStatusEnum = {
  values: ["Voting", "ApprovedForProject", "Rejected", "Implemented"] as const,

  is: {
    voting: (s: IdeaStatus) => s.tag === "Voting",
    approved: (s: IdeaStatus) => s.tag === "ApprovedForProject",
    rejected: (s: IdeaStatus) => s.tag === "Rejected",
    implemented: (s: IdeaStatus) => s.tag === "Implemented",
  },

  display(s: IdeaStatus): string {
    return s.tag === "ApprovedForProject" ? "Approved" : s.tag;
  },
} as const;

export const VoteTypeEnum = {
  values: ["Up", "Down", "Veto"] as const,

  is: {
    up: (v: VoteType) => v.tag === "Up",
    down: (v: VoteType) => v.tag === "Down",
    veto: (v: VoteType) => v.tag === "Veto",
  },

  display(v: VoteType): string {
    return v.tag.toLowerCase();
  },
} as const;

export const AgentRoleEnum = {
  values: ["Zoe", "Admin", "Zeno"] as const,

  is: {
    zoe: (r: AgentRole) => r.tag === "Zoe",
    admin: (r: AgentRole) => r.tag === "Admin",
    zeno: (r: AgentRole) => r.tag === "Zeno",
  },

  display(r: AgentRole): string {
    return r.tag.toLowerCase();
  },
} as const;

export const AgentStatusEnum = {
  values: ["Online", "Offline", "Working"] as const,

  is: {
    online: (s: AgentStatus) => s.tag === "Online",
    offline: (s: AgentStatus) => s.tag === "Offline",
    working: (s: AgentStatus) => s.tag === "Working",
  },

  display(s: AgentStatus): string {
    return s.tag;
  },
} as const;

export const ProjectStatusEnum = {
  values: ["Active", "Paused"] as const,

  is: {
    active: (s: ProjectStatus) => s.tag === "Active",
    paused: (s: ProjectStatus) => s.tag === "Paused",
  },

  display(s: ProjectStatus): string {
    return s.tag.toUpperCase();
  },
} as const;

export const AGENT_HEARTBEAT_TIMEOUT_MS = 120_000;
export const AGENT_PRESENCE_TICK_MS = 30_000;

type TimestampLike = { microsSinceUnixEpoch: bigint };

function getTimestampMillis(ts: TimestampLike | unknown): number {
  if (ts && typeof ts === "object" && "microsSinceUnixEpoch" in ts) {
    return Number((ts as TimestampLike).microsSinceUnixEpoch / 1000n);
  }
  return 0;
}

export function useNow(intervalMs = AGENT_PRESENCE_TICK_MS): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

export function isAgentEffectivelyOnline(
  agent: Agent,
  nowMs: number,
  timeoutMs = AGENT_HEARTBEAT_TIMEOUT_MS,
): boolean {
  const lastHeartbeatMs = getTimestampMillis(agent.lastHeartbeat);
  return nowMs - lastHeartbeatMs <= timeoutMs;
}

export function getAgentDisplayStatusTag(
  agent: Agent,
  nowMs: number,
  timeoutMs = AGENT_HEARTBEAT_TIMEOUT_MS,
): "Online" | "Offline" | "Working" {
  if (!isAgentEffectivelyOnline(agent, nowMs, timeoutMs)) {
    return "Offline";
  }
  return AgentStatusEnum.is.working(agent.status) ? "Working" : "Online";
}

export function splitAgentsByPresence(
  agents: Agent[],
  nowMs: number,
  timeoutMs = AGENT_HEARTBEAT_TIMEOUT_MS,
): { online: Agent[]; offline: Agent[] } {
  const online: Agent[] = [];
  const offline: Agent[] = [];

  for (const agent of agents) {
    if (isAgentEffectivelyOnline(agent, nowMs, timeoutMs)) {
      online.push(agent);
    } else {
      offline.push(agent);
    }
  }

  return { online, offline };
}

export function mapAgentsById(agents: Agent[]): Map<string, Agent> {
  const map = new Map<string, Agent>();
  for (const agent of agents) {
    map.set(agent.id, agent);
  }
  return map;
}

export function mapProjectNamesById(projects: Project[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const project of projects) {
    names[project.id.toString()] = project.name;
  }
  return names;
}

export function mapChannelNamesById(channels: Channel[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const channel of channels) {
    names[channel.id.toString()] = channel.name;
  }
  return names;
}

export const MessageTypeEnum = {
  values: ["User", "System", "Directive"] as const,

  is: {
    user: (t: MessageType) => t.tag === "User",
    system: (t: MessageType) => t.tag === "System",
    directive: (t: MessageType) => t.tag === "Directive",
  },

  display(t: MessageType): string {
    return t.tag.toLowerCase();
  },
} as const;
