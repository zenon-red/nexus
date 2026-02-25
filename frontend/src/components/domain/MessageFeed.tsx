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
      className="group message-feed-item flex items-start gap-3 px-4 py-2 transition-colors hover:bg-chat-bg-dark/20"
    >
      <div className="relative shrink-0 pt-2">
        {isZoe && <ZoeCrown />}
        <AlienAvatar seed={identitySeed} size={28} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-800">{agent?.name ?? senderId}</span>
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
          <Skeleton className="size-7 rounded-full bg-chat-bg-dark/40" />
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
  { text: "text-purple" },
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
    <div className="shrink-0 border-t border-white/10 bg-gradient-to-r from-slate-900/50 via-slate-900 to-slate-900/50">
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
                "h-9 cursor-pointer px-4 font-mono text-xs font-medium whitespace-nowrap transition-colors duration-150",
                !isLast && "border-r border-white/10",
                isActive
                  ? cn("bg-slate-900/85", colors.text, "font-semibold")
                  : cn("text-slate-300 hover:bg-slate-900/45 hover:text-slate-100"),
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
  const prevMessagesLength = useRef(0);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const [activeChannel, setActiveChannel] = useState("general");
  const [dismissedDirectiveId, setDismissedDirectiveId] = useState<string | null>(null);
  const isInitialLoading =
    (!messagesReady && messages.length === 0) || (!channelsReady && channels.length === 0);

  const handleChannelChange = useCallback(
    (newChannel: string) => {
      shouldStickToBottomRef.current = true;
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
          Number(a.createdAt.microsSinceUnixEpoch) - Number(b.createdAt.microsSinceUnixEpoch),
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
  const isDirectiveDismissed = !!latestDirectiveId && dismissedDirectiveId === latestDirectiveId;

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(-visibleCount);
  }, [filteredMessages, visibleCount]);

  const virtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const scrollToBottom = useCallback(() => {
    if (!parentRef.current) return;
    const scrollElement = parentRef.current;
    scrollElement.scrollTop = scrollElement.scrollHeight;
  }, []);

  const syncScrollToBottom = useCallback(() => {
    scrollToBottom();
    requestAnimationFrame(scrollToBottom);
  }, [scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (!parentRef.current || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    shouldStickToBottomRef.current = scrollHeight - (scrollTop + clientHeight) < 24;

    if (scrollTop < 100 && visibleMessages.length < filteredMessages.length) {
      setIsLoadingMore(true);
      const oldScrollHeight = parentRef.current.scrollHeight;

      requestAnimationFrame(() => {
        setVisibleCount((prev) => {
          const newCount = Math.min(prev + MESSAGES_PER_PAGE, filteredMessages.length);
          if (loadMoreTimeoutRef.current) {
            clearTimeout(loadMoreTimeoutRef.current);
          }
          loadMoreTimeoutRef.current = setTimeout(() => {
            if (parentRef.current) {
              const newScrollHeight = parentRef.current.scrollHeight;
              parentRef.current.scrollTop = newScrollHeight - oldScrollHeight;
            }
            setIsLoadingMore(false);
          }, 0);
          return newCount;
        });
      });
    }
  }, [isLoadingMore, visibleMessages.length, filteredMessages.length]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setVisibleCount(MESSAGES_PER_PAGE);
    prevMessagesLength.current = 0;
    shouldStickToBottomRef.current = true;
    requestAnimationFrame(syncScrollToBottom);
  }, [channelId, syncScrollToBottom]);

  useEffect(() => {
    const currentLength = filteredMessages.length;

    if (currentLength > prevMessagesLength.current && shouldStickToBottomRef.current) {
      requestAnimationFrame(syncScrollToBottom);
    }

    prevMessagesLength.current = currentLength;
  }, [filteredMessages.length, syncScrollToBottom]);

  useLayoutEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    syncScrollToBottom();
  }, [visibleMessages.length, syncScrollToBottom]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className={cn(
        "relative mx-auto flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-gradient-to-br from-chat-bg-light via-chat-bg-mid to-chat-bg-dark shadow-2xl sm:w-[95%]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--color-chat-highlight-soft)_0%,transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_38%,var(--color-chat-mid-soft)_0%,transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_56%_92%,var(--color-chat-shadow-soft)_0%,transparent_46%)]" />

      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        <div
          ref={parentRef}
          onScroll={handleScroll}
          className="scrollbar-thin scrollbar-track-transparent relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:oklch(0.58_0.02_260)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:!bg-slate-500/35 hover:[&::-webkit-scrollbar-thumb]:!bg-slate-500/50"
        >
          {latestChannelDirective && !isDirectiveDismissed && (
            <div className="sticky top-0 z-20 px-5 pt-4 pb-3">
              <ElectricBorder
                className="overflow-visible rounded-2xl"
                color="oklch(0.7 0.1 220)"
                speed={0.6}
                chaos={0.07}
                thickness={1}
              >
                <div className="relative rounded-[inherit] bg-surface/92 px-6 py-6">
                  <button
                    type="button"
                    onClick={() => setDismissedDirectiveId(latestDirectiveId)}
                    className="absolute top-3 right-4 z-30 cursor-pointer font-mono text-xl leading-none text-slate-300 transition-colors hover:text-white"
                    aria-label="Dismiss directive"
                    title="Dismiss"
                  >
                    ×
                  </button>
                  <p className="mb-4 text-[15px] leading-7 text-slate-300">
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

          <AnimatePresence>
            {isInitialLoading && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MessageFeedSkeleton />
              </m.div>
            )}

            {!isInitialLoading &&
              isLoadingMore &&
              visibleMessages.length < filteredMessages.length && (
                <m.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex items-center justify-center py-2 text-xs text-muted-foreground"
                >
                  Loading more...
                </m.div>
              )}
          </AnimatePresence>

          {!isInitialLoading && (
            <div
              className="mt-auto"
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

          {!isInitialLoading && visibleMessages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              [no messages yet]
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-12 bg-gradient-to-b from-chat-bg-light via-chat-bg-light/80 to-transparent" />
      </m.div>

      <ChannelSwitcher
        value={activeChannel}
        onValueChange={handleChannelChange}
        channels={channels}
      />
    </div>
  );
}
