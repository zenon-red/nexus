import { useMemo, useEffect, useRef, useReducer } from "react";
import {
  useMessages,
  useProjectMessages,
  useVotes,
  useTasks,
  useIdeas,
  TaskStatusEnum,
  VoteTypeEnum,
  IdeaStatusEnum,
} from "@/spacetime/hooks";
import { cn } from "@/lib/utils";

type Expression =
  | "zoe"
  | "zoe_blushing"
  | "zoe_disgusted"
  | "zoe_grin"
  | "zoe_hands_right"
  | "zoe_kiss"
  | "zoe_mad"
  | "zoe_open_mouth"
  | "zoe_praying"
  | "zoe_relaxed"
  | "zoe_shy"
  | "zoe_sleeping"
  | "zoe_wink_star"
  | "zoe_wink_znn";

type EventType =
  | "message"
  | "project_message"
  | "vote_up"
  | "vote_down"
  | "task_completed"
  | "task_assigned"
  | "idea_proposed"
  | "idea_approved"
  | "idea_rejected";

const expressionConfig: Record<EventType, Expression> = {
  message: "zoe_open_mouth",
  project_message: "zoe_open_mouth",
  vote_up: "zoe_wink_star",
  vote_down: "zoe_mad",
  task_completed: "zoe_grin",
  task_assigned: "zoe_hands_right",
  idea_proposed: "zoe_blushing",
  idea_approved: "zoe_wink_znn",
  idea_rejected: "zoe_disgusted",
};

const DEFAULT_EXPRESSION: Expression = "zoe_relaxed";
const EXPRESSION_DURATION_MS = 2000;

function getImagePath(expression: Expression): string {
  return `/zoe/${expression}.webp`;
}

interface TalkingHeadProps {
  showWordmark?: boolean;
}

type ExpressionState = {
  currentExpression: Expression;
  isTalking: boolean;
};

type ExpressionAction = { type: "activate"; expression: Expression } | { type: "reset" };

function expressionReducer(state: ExpressionState, action: ExpressionAction): ExpressionState {
  if (action.type === "activate") {
    return { currentExpression: action.expression, isTalking: true };
  }
  if (action.type === "reset") {
    return { currentExpression: DEFAULT_EXPRESSION, isTalking: false };
  }
  return state;
}

export function TalkingHead({ showWordmark = true }: TalkingHeadProps) {
  const messages = useMessages();
  const projectMessages = useProjectMessages();
  const votes = useVotes();
  const tasks = useTasks();
  const ideas = useIdeas();

  const [expressionState, dispatchExpression] = useReducer(expressionReducer, {
    currentExpression: DEFAULT_EXPRESSION,
    isTalking: false,
  });
  const lastEventTime = useRef<number>(0);
  const expressionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestEvent = useMemo((): { type: EventType; timestamp: number } | null => {
    let latest: { type: EventType; timestamp: number } | null = null;

    const setLatest = (type: EventType, timestamp: number) => {
      if (!latest || timestamp > latest.timestamp) {
        latest = { type, timestamp };
      }
    };

    messages.forEach((msg) => {
      setLatest("message", Number(msg.createdAt.microsSinceUnixEpoch));
    });

    projectMessages.forEach((msg) => {
      setLatest("project_message", Number(msg.createdAt.microsSinceUnixEpoch));
    });

    votes.forEach((vote) => {
      setLatest(
        VoteTypeEnum.is.up(vote.voteType) ? "vote_up" : "vote_down",
        Number(vote.createdAt.microsSinceUnixEpoch),
      );
    });

    tasks.forEach((task) => {
      const updatedAt = Number(task.updatedAt.microsSinceUnixEpoch);
      if (TaskStatusEnum.is.completed(task.status)) {
        setLatest("task_completed", updatedAt);
      }
      if (TaskStatusEnum.is.open(task.status) || TaskStatusEnum.is.inProgress(task.status)) {
        setLatest("task_assigned", updatedAt);
      }
    });

    ideas.forEach((idea) => {
      if (IdeaStatusEnum.is.voting(idea.status)) {
        setLatest("idea_proposed", Number(idea.createdAt.microsSinceUnixEpoch));
      }
      if (IdeaStatusEnum.is.approved(idea.status)) {
        setLatest("idea_approved", Number(idea.updatedAt.microsSinceUnixEpoch));
      }
      if (IdeaStatusEnum.is.rejected(idea.status)) {
        setLatest("idea_rejected", Number(idea.updatedAt.microsSinceUnixEpoch));
      }
    });

    return latest;
  }, [messages, projectMessages, votes, tasks, ideas]);

  useEffect(() => {
    if (!latestEvent) return;

    const now = Date.now() * 1000;
    const eventIsRecent = now - latestEvent.timestamp < 5000000;

    if (eventIsRecent && latestEvent.timestamp > lastEventTime.current) {
      lastEventTime.current = latestEvent.timestamp;

      const newExpression = expressionConfig[latestEvent.type] || DEFAULT_EXPRESSION;
      dispatchExpression({ type: "activate", expression: newExpression });

      if (expressionTimeout.current) {
        clearTimeout(expressionTimeout.current);
      }

      expressionTimeout.current = setTimeout(() => {
        dispatchExpression({ type: "reset" });
      }, EXPRESSION_DURATION_MS);
    }

    return () => {
      if (expressionTimeout.current) {
        clearTimeout(expressionTimeout.current);
      }
    };
  }, [latestEvent]);

  return (
    <div className="relative flex h-[33vh] max-h-100 min-h-70 w-full items-end justify-center overflow-hidden">
      {showWordmark && (
        <img
          src="/zoe/zoe-wordmark.png"
          alt="ZOE Wordmark"
          className="pointer-events-none absolute -top-20 left-1/2 h-auto w-[80%] max-w-[320px] -translate-x-1/2 object-contain opacity-90 select-none"
          loading="eager"
          decoding="async"
          draggable={false}
        />
      )}
      <img
        src={getImagePath(expressionState.currentExpression)}
        alt="ZOE"
        className={cn(
          "relative z-10 ml-10 h-auto w-full max-w-md object-contain object-bottom",
          expressionState.isTalking && "scale-[1.02]",
        )}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

export { expressionConfig, type Expression, type EventType };
