import type { ChallengeStore } from "../challenges.ts";
import type { KvRateLimiter } from "../rate-limit.ts";

export interface RouteContext {
  headers: HeadersInit;
  ip: string;
  challengeStore: ChallengeStore;
  rateLimiter: KvRateLimiter;
}
