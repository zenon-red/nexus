import { useMemo } from "react";
import { useProjects, useIdeas, useTasks, useAgents, useProjectMessages } from "@/spacetime/hooks";
import type {
  IdeasRow,
  TasksRow,
  AgentsRow,
  ProjectMessagesRow,
  ProjectsRow,
} from "@/spacetime/hooks";

export interface UseProjectResult {
  project: ProjectsRow | undefined;
  sourceIdea: IdeasRow | undefined;
  tasks: TasksRow[];
  assignees: AgentsRow[];
  messages: ProjectMessagesRow[];
  senders: AgentsRow[];
  creator: AgentsRow | undefined;
}

export function useProject(projectId: bigint | string): UseProjectResult {
  const projects = useProjects();
  const ideas = useIdeas();
  const tasks = useTasks();
  const agents = useAgents();
  const projectMessages = useProjectMessages();

  const id = useMemo(() => {
    if (typeof projectId !== "string") {
      return projectId;
    }

    try {
      return BigInt(projectId);
    } catch {
      return undefined;
    }
  }, [projectId]);

  return useMemo(() => {
    if (id === undefined) {
      return {
        project: undefined,
        sourceIdea: undefined,
        tasks: [],
        assignees: [],
        messages: [],
        senders: [],
        creator: undefined,
      };
    }

    const project = projects.find((p) => p.id === id);
    const sourceIdea = project ? ideas.find((i) => i.id === project.sourceIdeaId) : undefined;
    const projectTasks = tasks.filter((t) => t.projectId === id);
    const assigneeIds = [
      ...new Set(projectTasks.map((t) => t.assignedTo).filter((a): a is string => a !== null)),
    ];
    const assignees = agents.filter((a) => assigneeIds.includes(a.id));
    const messages = projectMessages.filter((m) => m.projectId === id);
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = agents.filter((a) => senderIds.includes(a.id));
    const creator = agents.find((a) => a.id === project?.createdBy);

    return {
      project,
      sourceIdea,
      tasks: projectTasks,
      assignees,
      messages,
      senders,
      creator,
    };
  }, [id, projects, ideas, tasks, agents, projectMessages]);
}
