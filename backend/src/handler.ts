import { ChallengeStore } from "./challenges.ts";
import {
  CHALLENGE_TTL,
  CORS_ORIGIN,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW,
  TRUST_PROXY,
} from "./config.ts";
import { corsHeaders, jsonHeaders } from "./http.ts";
import { KvRateLimiter, resolveClientIp } from "./rate-limit.ts";
import { handleAuthChallenge } from "./routes/auth-challenge.ts";
import { handleAuthToken } from "./routes/auth-token.ts";
import { handleDiscovery, handleJwks } from "./routes/discovery.ts";
import { handleHealth } from "./routes/health.ts";

export function createHandler(kv: Deno.Kv): Deno.ServeHandler {
  const headers = jsonHeaders(CORS_ORIGIN);
  const challengeStore = new ChallengeStore(kv, CHALLENGE_TTL);
  const rateLimiter = new KvRateLimiter(kv, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW);

  return async (req: Request, info: Deno.ServeHandlerInfo): Promise<Response> => {
    const url = new URL(req.url);
    const ip = resolveClientIp(req, info, TRUST_PROXY);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(CORS_ORIGIN) });
    }

    try {
      if (url.pathname === "/health" && req.method === "GET") {
        return handleHealth(headers);
      }

      if (url.pathname === "/.well-known/openid-configuration" && req.method === "GET") {
        return handleDiscovery(headers);
      }

      if (url.pathname === "/.well-known/jwks.json" && req.method === "GET") {
        return await handleJwks(headers);
      }

      if (url.pathname === "/auth/challenge" && req.method === "POST") {
        return await handleAuthChallenge(req, {
          headers,
          ip,
          challengeStore,
          rateLimiter,
        });
      }

      if (url.pathname === "/auth/token" && req.method === "POST") {
        return await handleAuthToken(req, {
          headers,
          ip,
          challengeStore,
          rateLimiter,
        });
      }

      return Response.json(
        { error: "not_found", message: "Not found" },
        { status: 404, headers },
      );
    } catch (error) {
      console.error("Error:", error);
      return Response.json(
        { error: "internal_error", message: "Internal server error" },
        { status: 500, headers },
      );
    }
  };
}
