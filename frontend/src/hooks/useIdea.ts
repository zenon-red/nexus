import { useMemo } from "react";
import { useIdeas, useVotes, useAgents, useProjects, useTasks } from "@/spacetime/hooks";
import type { IdeasRow, VotesRow, AgentsRow, TasksRow, ProjectsRow } from "@/spacetime/hooks";

export interface UseIdeaResult {
  idea: IdeasRow | undefined;
  votes: VotesRow[];
  voters: AgentsRow[];
  linkedProject: ProjectsRow | undefined;
  projectTasks: TasksRow[];
  creator: AgentsRow | undefined;
}

export function useIdea(ideaId: bigint | string): UseIdeaResult {
  const ideas = useIdeas();
  const votes = useVotes();
  const agents = useAgents();
  const projects = useProjects();
  const tasks = useTasks();

  const id = useMemo(() => {
    if (typeof ideaId !== "string") return ideaId;
    try {
      return BigInt(ideaId);
    } catch {
      return undefined;
    }
  }, [ideaId]);

  return useMemo(() => {
    if (id === undefined) {
      return {
        idea: undefined,
        votes: [],
        voters: [],
        linkedProject: undefined,
        projectTasks: [],
        creator: undefined,
      };
    }

    const idea = ideas.find((i) => i.id === id);
    const ideaVotes = votes.filter((v) => v.ideaId === id);
    const voterIds = [...new Set(ideaVotes.map((v) => v.agentId))];
    const voters = agents.filter((a) => voterIds.includes(a.id));
    const linkedProject = projects.find((p) => p.sourceIdeaId === id);
    const projectTasks = linkedProject ? tasks.filter((t) => t.projectId === linkedProject.id) : [];
    const creator = agents.find((a) => a.id === idea?.createdBy);

    return {
      idea,
      votes: ideaVotes,
      voters,
      linkedProject,
      projectTasks,
      creator,
    };
  }, [id, ideas, votes, agents, projects, tasks]);
}
