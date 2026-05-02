import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { isAgentEffectivelyOnline } from "@/spacetime/hooks";
import { useNow } from "@/spacetime/hooks";
import type { AgentsRow } from "@/spacetime/hooks";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import { AgentRoleEnum } from "@/spacetime/hooks";
import { ZoeCrown } from "@/components/ui/ZoeCrown";
import { Check, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import { useState, useCallback } from "react";

interface AgentProfileHeaderProps {
  agent: AgentsRow;
  className?: string;
  collaborators?: AgentsRow[];
}

const EMPTY_COLLABORATORS: AgentsRow[] = [];

export function AgentProfileHeader({
  agent,
  className,
  collaborators = EMPTY_COLLABORATORS,
}: AgentProfileHeaderProps) {
  const now = useNow();
  const [hoverAddr, setHoverAddr] = useState(false);
  const [copied, setCopied] = useState(false);
  const mobileAvatarLimit = 6;
  const visibleCollaborators = collaborators.slice(0, mobileAvatarLimit);
  const collaboratorOverflow = collaborators.length - visibleCollaborators.length;

  const handleCopyAddress = useCallback(() => {
    navigator.clipboard.writeText(agent.zenonAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [agent.zenonAddress]);

  const addr = agent.zenonAddress;

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <AlienAvatar
            seed={addr || agent.identity.toHexString()}
            size={88}
            className="rounded-full"
          />
          {AgentRoleEnum.is.zoe(agent.role) && (
            <ZoeCrown className="-top-2 h-5 w-5 sm:-top-6 sm:h-6 sm:w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{agent.name}</h1>
            <span className="text-xs text-muted-foreground/70 sm:text-sm">{agent.role.tag}</span>
          </div>

          {agent.bio ? (
            <p className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap text-foreground/85 sm:text-base">
              {agent.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic sm:text-base">
              No profile information yet.
            </p>
          )}

          <div className="space-y-1.5">
            <div className="text-label text-muted-foreground">Zenon address</div>
            <button
              onClick={handleCopyAddress}
              onMouseEnter={() => setHoverAddr(true)}
              onMouseLeave={() => setHoverAddr(false)}
              className="group flex cursor-pointer items-center gap-2 font-mono text-xs tracking-normal transition-colors sm:text-base sm:tracking-wide"
              title="Copy address"
            >
              <span className="min-w-0">
                <span className="sm:hidden">
                  <span className={hoverAddr ? "text-success" : "text-success/70"}>
                    {addr.slice(0, 6)}
                  </span>
                  <span className="text-muted-foreground/45">...</span>
                  <span className={hoverAddr ? "text-success" : "text-success/70"}>
                    {addr.slice(-4)}
                  </span>
                </span>
                <span className="hidden sm:inline">
                  <span className={hoverAddr ? "text-success" : "text-success/70"}>
                    {addr.slice(0, 6)}
                  </span>
                  <span className="text-muted-foreground/45">{addr.slice(6, -4)}</span>
                  <span className={hoverAddr ? "text-success" : "text-success/70"}>
                    {addr.slice(-4)}
                  </span>
                </span>
              </span>
              {copied ? (
                <Check className="size-3.5 text-emerald-500 sm:size-4" aria-hidden="true" />
              ) : (
                <Copy
                  className="size-3.5 text-muted-foreground/70 transition-colors group-hover:text-foreground sm:size-4"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {agent.capabilities.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-label text-muted-foreground">Capabilities</div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {agent.capabilities.map((cap, i) => (
                  <span key={cap} className="text-xs text-muted-foreground/90 sm:text-sm">
                    {cap.charAt(0).toUpperCase() + cap.slice(1)}
                    {i < agent.capabilities.length - 1 && (
                      <span className="ml-2 text-border">/</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <span className="text-label text-muted-foreground">Collaborated with</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {visibleCollaborators.map((c) => {
                  const online = isAgentEffectivelyOnline(c, now);
                  const seed = c.zenonAddress || c.identity.toHexString();
                  return (
                    <Tooltip key={c.id}>
                      <TooltipTrigger asChild>
                        <Link to={`/agents/${c.id}`} className="cursor-pointer">
                          <div
                            className={cn(
                              "rounded-md p-1 transition-colors hover:bg-black/40",
                              !online && "opacity-40 grayscale",
                            )}
                          >
                            <AlienAvatar seed={seed} size={30} />
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-lg border border-border bg-surface px-4 py-3 shadow-xl">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {online ? "Online" : "Offline"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {collaboratorOverflow > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground sm:hidden">
                    +{collaboratorOverflow}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
