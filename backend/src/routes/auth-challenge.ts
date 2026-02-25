import { CHALLENGE_TTL, ISSUER_URL } from "../config.ts";
import { parseJsonBody, getStringField } from "../http.ts";
import { validateZenonAddress } from "../zenon.ts";
import type { RouteContext } from "./context.ts";

export async function handleAuthChallenge(req: Request, ctx: RouteContext): Promise<Response> {
  const rateLimit = await ctx.rateLimiter.check(ctx.ip);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "rate_limited", message: "Too many requests" },
      { status: 429, headers: ctx.headers },
    );
  }

  const parsedBody = await parseJsonBody(req, ctx.headers);
  if ("error" in parsedBody) return parsedBody.error;

  const body = parsedBody.data;
  const address = getStringField(body, "address");

  if (!address || !validateZenonAddress(address)) {
    return Response.json(
      { error: "invalid_address", message: "Invalid Zenon address format" },
      { status: 400, headers: ctx.headers },
    );
  }

  const nonce = crypto.randomUUID();
  const challenge = `Sign to authenticate with ${ISSUER_URL}: ${nonce}`;
  const now = Math.floor(Date.now() / 1000);

  await ctx.challengeStore.store(nonce, {
    nonce,
    address,
    challenge,
    createdAt: now,
    expiresAt: now + CHALLENGE_TTL,
  });

  return Response.json({
    nonce,
    challenge,
    expires_at: now + CHALLENGE_TTL,
  }, { headers: ctx.headers });
}
