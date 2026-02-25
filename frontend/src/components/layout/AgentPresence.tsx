import { useMemo } from "react";
import { m, LayoutGroup } from "motion/react";
import {
  useAgents,
  AgentsRow,
  useNow,
  splitAgentsByPresence,
  getAgentDisplayStatusTag,
} from "@/spacetime/hooks";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";

const AVATAR_MOTION_TRANSITION = {
  type: "spring",
  stiffness: 200,
  damping: 25,
} as const;

function AgentAvatar({
  agent,
  size,
  className,
}: {
  agent: AgentsRow;
  size: number;
  className?: string;
}) {
  return (
    <AlienAvatar
      seed={agent.zenonAddress || agent.identity.toHexString()}
      size={size}
      className={className}
    />
  );
}

interface OnlineAgentsProps {
  maxAvatars?: number;
}

export function OnlineAgents({ maxAvatars = 6 }: OnlineAgentsProps) {
  const agents = useAgents();
  const now = useNow();
  const { online: onlineAgents } = useMemo(() => splitAgentsByPresence(agents, now), [agents, now]);
  const overflow = Math.max(0, onlineAgents.length - maxAvatars);

  if (onlineAgents.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {onlineAgents.slice(0, maxAvatars).map((agent) => (
        <Tooltip key={agent.id}>
          <TooltipTrigger asChild>
            <m.div
              layoutId={`avatar-online-${agent.id}`}
              className="-m-1 cursor-pointer rounded-md p-1 hover:bg-black/40"
              animate={{
                filter: "grayscale(0)",
                scale: 1,
              }}
              transition={AVATAR_MOTION_TRANSITION}
            >
              <AgentAvatar agent={agent} size={28} />
            </m.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{getAgentDisplayStatusTag(agent, now)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {overflow > 0 && <span className="ml-1 text-xs text-muted-foreground">+{overflow}</span>}
    </div>
  );
}

interface OfflineAgentsProps {
  maxAvatars?: number;
}

export function OfflineAgents({ maxAvatars = 4 }: OfflineAgentsProps) {
  const agents = useAgents();
  const now = useNow();
  const { offline: offlineAgents } = useMemo(
    () => splitAgentsByPresence(agents, now),
    [agents, now],
  );
  const overflow = Math.max(0, offlineAgents.length - maxAvatars);

  if (offlineAgents.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {offlineAgents.slice(0, maxAvatars).map((agent) => (
        <Tooltip key={agent.id}>
          <TooltipTrigger asChild>
            <m.div
              layoutId={`avatar-offline-${agent.id}`}
              className="-m-1 cursor-pointer rounded-md p-1 opacity-40 hover:bg-black/40"
              animate={{
                filter: "grayscale(1)",
              }}
              transition={AVATAR_MOTION_TRANSITION}
            >
              <AgentAvatar agent={agent} size={20} />
            </m.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{getAgentDisplayStatusTag(agent, now)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
      {overflow > 0 && <span className="ml-1 text-xs text-muted-foreground">+{overflow}</span>}
    </div>
  );
}

interface AgentPresenceProps {
  maxAvatars?: number;
}

export function AgentPresence({ maxAvatars = 8 }: AgentPresenceProps) {
  return (
    <LayoutGroup>
      <div className="flex w-full items-center justify-between gap-2">
        <OnlineAgents maxAvatars={maxAvatars} />

        <OfflineAgents maxAvatars={maxAvatars} />
      </div>
    </LayoutGroup>
  );
}
