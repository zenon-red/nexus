import {
  memo,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  type WheelEvent,
} from "react";
import { m, AnimatePresence } from "motion/react";
import {
  useMessagesSnapshot,
  useChannelsSnapshot,
  useAgentsSnapshot,
  AgentRoleEnum,
  mapAgentsById,
} from "@/spacetime/hooks";

import type { AgentsRow } from "@/spacetime/hooks";

import { cn } from "@/lib/utils";
import { AlienAvatar } from "@zenon-red/alien-avatars-react";
import { ZoeCrown } from "@/components/ui/ZoeCrown";
import { useVirtualizer } from "@tanstack/react-virtual";
import ElectricBorder from "@/components/ElectricBorder";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router";

const MESSAGES_PER_PAGE = 50;

function getAgentAvatarSeed(agent: AgentsRow): string {
  return agent.zenonAddress || agent.identity.toHexString();
}

function formatTime(timestamp: { microsSinceUnixEpoch: bigint }): string {
  const date = new Date(Number(timestamp.microsSinceUnixEpoch / 1000n));
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRelativeAgo(timestamp: { microsSinceUnixEpoch: bigint }): string {
  const nowMs = Date.now();
  const thenMs = Number(timestamp.microsSinceUnixEpoch / 1000n);
  const diffMs = Math.max(0, nowMs - thenMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs >= day) return `${Math.floor(diffMs / day)}d ago`;
  if (diffMs >= hour) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs >= minute) return `${Math.floor(diffMs / minute)}m ago`;
  return "just now";
}

interface MessageItemProps {
  senderId: string;
  content: string;
  createdAt: { microsSinceUnixEpoch: bigint };
  index: number;
  agent?: AgentsRow;
}

const MessageItem = memo(function MessageItem({
  senderId,
  content,
  createdAt,
  index,
  agent,
}: MessageItemProps) {
  const identitySeed = agent ? getAgentAvatarSeed(agent) : senderId;
  const isZoe = senderId === "zr-zoe" || (!!agent && AgentRoleEnum.is.zoe(agent.role));
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, delay: Math.min(index * 0.005, 0.05) }}
      className="group flex items-start gap-3 border-b !border-border/5 bg-slate-200/95 px-4 py-3 transition-colors hover:bg-slate-200"
    >
      <div className="relative shrink-0 pt-2">
        {isZoe && <ZoeCrown />}
        <Link to={`/agents/${senderId}`}>
          <AlienAvatar seed={identitySeed} size={32} />
        </Link>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link
            to={`/agents/${senderId}`}
            className="text-sm font-medium text-slate-800 hover:underline"
          >
            {agent?.name ?? senderId}
          </Link>
          <span className="font-mono text-tiny text-slate-500 tabular-nums">
            {formatTime(createdAt)}
          </span>
        </div>
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-slate-700">
          {content}
        </p>
      </div>
    </m.div>
  );
});

function MessageFeedSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3">
          <Skeleton className="size-8 rounded-full bg-chat-bg-dark/40" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-28 bg-chat-bg-dark/40" />
            <Skeleton className="h-3 w-14 bg-chat-bg-dark/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

const channelColors = [
  { text: "text-primary" },
  { text: "text-info" },
  { text: "text-accent" },
  { text: "text-success" },
  { text: "text-warning" },
];

function ChannelSwitcher({
  value,
  onValueChange,
  channels,
}: {
  value: string;
  onValueChange: (value: string) => void;
  channels: { id: bigint; name: string }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollLeft += e.deltaY;
  }, []);

  const handleClick = (channelName: string, index: number) => {
    onValueChange(channelName);

    const button = buttonRefs.current[index];
    if (button) {
      button.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  return (
    <div className="relative z-10 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-surface">
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="scrollbar-none scroll-touch flex items-center overflow-x-auto"
      >
        {channels.map((channel, index) => {
          const colors = channelColors[index % channelColors.length];
          const isActive = value === channel.name;
          const isLast = index === channels.length - 1;
          return (
            <button
              key={channel.id.toString()}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              onClick={() => handleClick(channel.name, index)}
              className={cn(
                "h-9 cursor-pointer px-4 font-mono text-xs font-medium whitespace-nowrap transition-colors duration-150 first:rounded-tl-xl last:rounded-tr-xl",
                !isLast && "border-r border-border/20",
                isActive
                  ? cn("bg-zinc-950/95", colors.text, "font-semibold")
                  : cn("text-slate-200 hover:bg-zinc-950/85 hover:text-slate-100"),
              )}
            >
              #{channel.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MessageFeedProps {
  className?: string;
  onActiveChannelChange?: (channel: string) => void;
}

export function MessageFeed({ className, onActiveChannelChange }: MessageFeedProps) {
  const { rows: messages, isReady: messagesReady } = useMessagesSnapshot();
  const { rows: channels, isReady: channelsReady } = useChannelsSnapshot();
  const { rows: agents } = useAgentsSnapshot();
  const parentRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFilteredLengthRef = useRef(0);
  const firstVisibleMessageIdRef = useRef<bigint | null>(null);
  const [activeChannel, setActiveChannel] = useState("general");

  // Per-channel directive dismissal persisted to localStorage
  const [dismissedDirectives, setDismissedDirectives] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("nexus:dismissed-directives");
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const dismissDirective = useCallback(
    (channelIdStr: string, directiveId: string | null) => {
      if (!directiveId) return;
      const map = { ...dismissedDirectives };
      map[channelIdStr] = directiveId;
      setDismissedDirectives(map);
      try {
        localStorage.setItem("nexus:dismissed-directives", JSON.stringify(map));
      } catch {
        // ignore quota errors
      }
    },
    [dismissedDirectives],
  );

  const isInitialLoading =
    (!messagesReady && messages.length === 0) || (!channelsReady && channels.length === 0);

  const handleChannelChange = useCallback(
    (newChannel: string) => {
      setActiveChannel(newChannel);
      onActiveChannelChange?.(newChannel);
    },
    [onActiveChannelChange],
  );

  const agentsMap = useMemo(() => {
    return mapAgentsById(agents);
  }, [agents]);

  const channelId = useMemo(() => {
    const channel = channels.find((c) => c.name === activeChannel);
    return channel?.id ?? 1n;
  }, [channels, activeChannel]);

  const filteredMessages = useMemo(() => {
    return [...messages]
      .filter(
        (m) =>
          m.channelId === channelId && m.senderId !== "system" && m.messageType.tag !== "Directive",
      )
      .sort(
        (a, b) =>
          Number(b.createdAt.microsSinceUnixEpoch) - Number(a.createdAt.microsSinceUnixEpoch),
      );
  }, [messages, channelId]);

  const latestChannelDirective = useMemo(() => {
    const directives = messages
      .filter(
        (message) => message.channelId === channelId && message.messageType.tag === "Directive",
      )
      .sort(
        (a, b) =>
          Number(b.createdAt.microsSinceUnixEpoch) - Number(a.createdAt.microsSinceUnixEpoch),
      );

    return directives[0] ?? null;
  }, [messages, channelId]);

  const latestDirectiveId = latestChannelDirective ? latestChannelDirective.id.toString() : null;
  const channelIdStr = channelId.toString();
  const isDirectiveDismissed =
    !!latestDirectiveId && dismissedDirectives[channelIdStr] === latestDirectiveId;

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(0, visibleCount);
  }, [filteredMessages, visibleCount]);

  const virtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const handleScroll = useCallback(() => {
    if (!parentRef.current || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;

    // Track first visible message for scroll anchoring
    const items = virtualizer.getVirtualItems();
    if (items.length > 0) {
      firstVisibleMessageIdRef.current = visibleMessages[items[0].index]?.id ?? null;
    }

    // Load more when near the bottom (scroll down = older history)
    if (
      scrollHeight - (scrollTop + clientHeight) < 100 &&
      visibleMessages.length < filteredMessages.length
    ) {
      setIsLoadingMore(true);

      requestAnimationFrame(() => {
        setVisibleCount((prev) => {
          const newCount = Math.min(prev + MESSAGES_PER_PAGE, filteredMessages.length);
          if (loadMoreTimeoutRef.current) {
            clearTimeout(loadMoreTimeoutRef.current);
          }
          loadMoreTimeoutRef.current = setTimeout(() => {
            setIsLoadingMore(false);
          }, 0);
          return newCount;
        });
      });
    }
  }, [isLoadingMore, visibleMessages, filteredMessages.length]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  // Scroll anchoring — when new messages prepend, preserve the user's
  // scroll position so they aren't pushed down while reading history.
  useLayoutEffect(() => {
    const prevLen = prevFilteredLengthRef.current;
    const currLen = filteredMessages.length;
    prevFilteredLengthRef.current = currLen;

    if (prevLen === 0) return;
    if (currLen <= prevLen) return;
    if (!parentRef.current) return;

    const firstId = firstVisibleMessageIdRef.current;
    if (parentRef.current.scrollTop < 48) return;
    if (!firstId) return;

    const oldFirstIndex = filteredMessages.findIndex((m) => m.id === firstId);
    if (oldFirstIndex === -1) return;

    const items = virtualizer.getVirtualItems();
    const anch = items.find((v) => visibleMessages[v.index]?.id === firstId);
    if (anch) {
      parentRef.current.scrollTop = anch.start;
    }
  }, [filteredMessages.length]);

  // Reset to top on channel switch or initial load
  useEffect(() => {
    setVisibleCount(MESSAGES_PER_PAGE);
    prevFilteredLengthRef.current = filteredMessages.length;
    firstVisibleMessageIdRef.current = null;
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [channelId]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className={cn(
        "relative flex h-[85vh] w-full flex-col gap-2 bg-background shadow-2xl",
        className,
      )}
    >
      <ChannelSwitcher
        value={activeChannel}
        onValueChange={handleChannelChange}
        channels={channels}
      />

      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-background"
      >
        <div
          ref={parentRef}
          onScroll={handleScroll}
          className="scrollbar-thin scrollbar-track-transparent relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-slate-200/95 [scrollbar-color:oklch(0.58_0.02_260)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-500/35! hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/50!"
        >
          <AnimatePresence>
            {isInitialLoading && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MessageFeedSkeleton />
              </m.div>
            )}
          </AnimatePresence>

          {!isInitialLoading && (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualItem) => {
                const msg = visibleMessages[virtualItem.index];

                return (
                  <div
                    key={msg.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <MessageItem
                      senderId={msg.senderId}
                      content={msg.content}
                      createdAt={msg.createdAt}
                      index={virtualItem.index}
                      agent={agentsMap.get(msg.senderId)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {!isInitialLoading &&
            isLoadingMore &&
            visibleMessages.length < filteredMessages.length && (
              <m.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex items-center justify-center py-3 text-xs text-muted-foreground"
              >
                Loading older messages...
              </m.div>
            )}

          {!isInitialLoading && visibleMessages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              [no messages yet]
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-linear-to-t from-chat-bg-dark via-chat-bg-dark/80 to-transparent" />

        {latestChannelDirective && !isDirectiveDismissed && (
          <div className="absolute right-0 bottom-0 left-0 z-20 px-5 pb-4">
            <ElectricBorder
              className="overflow-visible rounded-md"
              color="oklch(0.7 0.1 220)"
              speed={0.6}
              chaos={0.07}
              thickness={1}
            >
              <div className="relative rounded-[inherit] bg-surface/92 px-6 py-6">
                <button
                  type="button"
                  onClick={() => dismissDirective(channelIdStr, latestDirectiveId)}
                  className="absolute top-3 right-4 z-30 cursor-pointer font-mono text-xl leading-none text-slate-300 transition-colors hover:text-white"
                  aria-label="Dismiss directive"
                  title="Dismiss"
                >
                  ×
                </button>
                <p className="mb-4 text-[15px] leading-7 whitespace-pre-wrap text-slate-300">
                  {latestChannelDirective.content}
                </p>
                <div className="flex items-center justify-between font-mono text-xs text-slate-500">
                  <span className="rounded-sm border border-info/45 bg-info/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-info uppercase">
                    Directive
                  </span>
                  <span>— ZŌE, {formatRelativeAgo(latestChannelDirective.createdAt)}</span>
                </div>
              </div>
            </ElectricBorder>
          </div>
        )}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-linear-to-t from-chat-bg-dark via-chat-bg-dark/80 to-transparent" />
      </m.div>
    </div>
  );
}
