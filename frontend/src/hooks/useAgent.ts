import { useMemo } from "react";
import {
  useAgents,
  useTasks,
  useIdeas,
  useVotes,
  useMessages,
  useProjectMessages,
  useDiscoveredTasks,
  useProjects,
} from "@/spacetime/hooks";
import type {
  AgentsRow,
  TasksRow,
  IdeasRow,
  VotesRow,
  MessagesRow,
  ProjectMessagesRow,
  DiscoveredTasksRow,
} from "@/spacetime/hooks";

export interface UseAgentResult {
  agent: AgentsRow | undefined;

  // Tasks
  assignedTasks: TasksRow[];
  createdTasks: TasksRow[];
  currentTask: TasksRow | undefined;

  // Ideas
  proposedIdeas: IdeasRow[];

  // Votes
  votes: VotesRow[];

  // Messages
  messages: MessagesRow[];
  projectMessages: ProjectMessagesRow[];

  // Discoveries
  discoveries: DiscoveredTasksRow[];
  reviewedDiscoveries: DiscoveredTasksRow[];

  // Related agents
  collaborators: AgentsRow[];

  // Loading
  isReady: boolean;
}

export function useAgent(agentId: string): UseAgentResult {
  const agents = useAgents();
  const tasks = useTasks();
  const ideas = useIdeas();
  const votes = useVotes();
  const messages = useMessages();
  const projectMessages = useProjectMessages();
  const discoveredTasks = useDiscoveredTasks();
  const projects = useProjects();

  return useMemo(() => {
    const agent = agents.find((a) => a.id === agentId);

    if (!agent) {
      return {
        agent: undefined,
        assignedTasks: [],
        createdTasks: [],
        currentTask: undefined,
        proposedIdeas: [],
        votes: [],
        messages: [],
        projectMessages: [],
        discoveries: [],
        reviewedDiscoveries: [],
        collaborators: [],
        isReady: agents.length > 0,
      };
    }

    const assignedTasks = tasks.filter((t) => t.assignedTo === agentId);
    const createdTasks = tasks.filter((t) => t.createdBy === agentId);
    const currentTask = agent.currentTaskId
      ? tasks.find((t) => t.id === agent.currentTaskId)
      : undefined;

    const proposedIdeas = ideas.filter((i) => i.createdBy === agentId);
    const agentVotes = votes.filter((v) => v.agentId === agentId);

    const agentMessages = messages.filter((m) => m.senderId === agentId);
    const agentProjectMessages = projectMessages.filter((m) => m.senderId === agentId);

    const discoveries = discoveredTasks.filter((d) => d.discoveredBy === agentId);
    const reviewedDiscoveries = discoveredTasks.filter((d) => d.reviewedBy === agentId);

    // Derive collaborators from shared project participation
    const projectIds = new Set([
      ...assignedTasks.map((t) => t.projectId.toString()),
      ...createdTasks.map((t) => t.projectId.toString()),
      ...agentProjectMessages.map((m) => m.projectId.toString()),
    ]);

    const collaboratorIds = new Set<string>();
    for (const pid of projectIds) {
      const projectTasks = tasks.filter((t) => t.projectId.toString() === pid);
      for (const t of projectTasks) {
        if (t.assignedTo && t.assignedTo !== agentId) {
          collaboratorIds.add(t.assignedTo);
        }
        if (t.createdBy !== agentId) {
          collaboratorIds.add(t.createdBy);
        }
      }
      const projectMsgs = projectMessages.filter((m) => m.projectId.toString() === pid);
      for (const m of projectMsgs) {
        if (m.senderId !== agentId) {
          collaboratorIds.add(m.senderId);
        }
      }
    }

    const collaborators = agents.filter((a) => collaboratorIds.has(a.id));

    return {
      agent,
      assignedTasks,
      createdTasks,
      currentTask,
      proposedIdeas,
      votes: agentVotes,
      messages: agentMessages,
      projectMessages: agentProjectMessages,
      discoveries,
      reviewedDiscoveries,
      collaborators,
      isReady: true,
    };
  }, [agentId, agents, tasks, ideas, votes, messages, projectMessages, discoveredTasks, projects]);
}
