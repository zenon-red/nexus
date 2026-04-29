import { ChallengeStore } from "./challenges.ts";
import { loadConfig, type BackendConfig } from "./config.ts";
import { corsHeaders, jsonHeaders } from "./http.ts";
import { KvRateLimiter, resolveClientIp } from "./rate-limit.ts";
import { handleAuthChallenge } from "./routes/auth-challenge.ts";
import { handleAuthToken } from "./routes/auth-token.ts";
import { handleDiscovery, handleJwks } from "./routes/discovery.ts";
import { handleHealth } from "./routes/health.ts";

export interface HandlerOptions {
  config?: BackendConfig;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
}

export function createHandler(kv: Deno.Kv, options?: HandlerOptions): Deno.ServeHandler {
  const config = options?.config ?? loadConfig();
  const headers = jsonHeaders(config.corsOrigin);
  const challengeStore = new ChallengeStore(kv, config.challengeTtl);
  const rateLimiter = new KvRateLimiter(
    kv,
    options?.rateLimitRequests ?? config.rateLimitRequests,
    options?.rateLimitWindow ?? config.rateLimitWindow,
  );

  return async (req: Request, info: Deno.ServeHandlerInfo): Promise<Response> => {
    const url = new URL(req.url);
    const ip = resolveClientIp(req, info, config.trustProxy);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(config.corsOrigin) });
    }

    try {
      if (url.pathname === "/health" && req.method === "GET") {
        return await handleHealth(headers, kv, config);
      }

      if (url.pathname === "/.well-known/openid-configuration" && req.method === "GET") {
        return handleDiscovery(headers, config);
      }

      if (url.pathname === "/.well-known/jwks.json" && req.method === "GET") {
        return await handleJwks(headers, config);
      }

      if (url.pathname === "/auth/challenge" && req.method === "POST") {
        return await handleAuthChallenge(req, {
          headers,
          ip,
          challengeStore,
          rateLimiter,
          config,
        });
      }

      if (url.pathname === "/auth/token" && req.method === "POST") {
        return await handleAuthToken(req, {
          headers,
          ip,
          challengeStore,
          rateLimiter,
          config,
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
