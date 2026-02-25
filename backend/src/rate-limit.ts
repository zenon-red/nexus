import type { RateLimitStatus } from "./types.ts";

export function normalizeIp(value: string): string {
  return value.trim().replace(/^\[|\]$/g, "");
}

function getForwardedIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!forwardedFor) return null;

  const first = forwardedFor.split(",")[0]?.trim();
  return first ? normalizeIp(first) : null;
}

export function resolveClientIp(
  req: Request,
  info: Deno.ServeHandlerInfo,
  trustProxy: boolean,
): string {
  const remoteIp = info.remoteAddr.transport === "tcp"
    ? normalizeIp(info.remoteAddr.hostname)
    : "unknown";

  return trustProxy ? getForwardedIp(req) || remoteIp : remoteIp;
}

export class KvRateLimiter {
  constructor(
    private readonly kv: Deno.Kv,
    private readonly maxRequests: number,
    private readonly windowSeconds: number,
  ) {}

  async check(ip: string): Promise<RateLimitStatus> {
    const now = Date.now();
    const windowMs = this.windowSeconds * 1000;
    const key = ["rate_limit", ip];

    for (let attempt = 0; attempt < 3; attempt++) {
      const entry = await this.kv.get<{ count: number; resetAt: number }>(key);

      if (!entry.value || now > entry.value.resetAt) {
        const resetAt = now + windowMs;
        const write = await this.kv.atomic()
          .check(entry)
          .set(key, { count: 1, resetAt }, { expireIn: windowMs })
          .commit();

        if (write.ok) {
          return { allowed: true, remaining: this.maxRequests - 1 };
        }

        continue;
      }

      const nextCount = entry.value.count + 1;
      const remainingMs = Math.max(1, entry.value.resetAt - now);
      const write = await this.kv.atomic()
        .check(entry)
        .set(key, { count: nextCount, resetAt: entry.value.resetAt }, { expireIn: remainingMs })
        .commit();

      if (write.ok) {
        return {
          allowed: nextCount <= this.maxRequests,
          remaining: Math.max(0, this.maxRequests - nextCount),
        };
      }
    }

    return { allowed: false, remaining: 0 };
  }
}
