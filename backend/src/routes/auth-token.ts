import { Buffer } from "buffer";
import { Crypto } from "znn-typescript-sdk/crypto";
import { isValidHexString } from "../crypto.ts";
import { parseJsonBody, getStringField } from "../http.ts";
import { issueToken } from "../oidc.ts";
import { addressMatchesPublicKey, validateZenonAddress } from "../zenon.ts";
import type { RouteContext } from "./context.ts";

export async function handleAuthToken(req: Request, ctx: RouteContext): Promise<Response> {
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
  const publicKey = getStringField(body, "public_key");
  const signature = getStringField(body, "signature");
  const nonce = getStringField(body, "nonce");

  if (!address || !validateZenonAddress(address)) {
    return Response.json(
      { error: "invalid_address", message: "Invalid Zenon address format" },
      { status: 400, headers: ctx.headers },
    );
  }

  if (!publicKey || !isValidHexString(publicKey, 32)) {
    return Response.json(
      { error: "invalid_public_key", message: "Invalid public key format" },
      { status: 400, headers: ctx.headers },
    );
  }

  if (!addressMatchesPublicKey(address, publicKey)) {
    console.warn("Address/public key mismatch", { address, ip: ctx.ip });
    return Response.json(
      { error: "address_key_mismatch", message: "Address does not match signing key" },
      { status: 401, headers: ctx.headers },
    );
  }

  if (!signature || !isValidHexString(signature, 64)) {
    return Response.json(
      { error: "invalid_signature", message: "Invalid signature format" },
      { status: 400, headers: ctx.headers },
    );
  }

  if (!nonce) {
    return Response.json(
      { error: "invalid_nonce", message: "Nonce is required" },
      { status: 400, headers: ctx.headers },
    );
  }

  const challengeData = await ctx.challengeStore.get(nonce);
  if (!challengeData || challengeData.address !== address) {
    return Response.json(
      { error: "expired_nonce", message: "Invalid or expired nonce" },
      { status: 400, headers: ctx.headers },
    );
  }

  const isValid = await Crypto.verify(
    Buffer.from(signature, "hex"),
    Buffer.from(challengeData.challenge, "utf8"),
    Buffer.from(publicKey, "hex"),
  );

  if (!isValid) {
    return Response.json(
      { error: "invalid_signature", message: "Invalid Ed25519 signature" },
      { status: 401, headers: ctx.headers },
    );
  }

  const consumed = await ctx.challengeStore.consumeIfMatches(nonce, address);
  if (!consumed) {
    return Response.json(
      { error: "expired_nonce", message: "Nonce was already consumed" },
      { status: 400, headers: ctx.headers },
    );
  }

  return Response.json(await issueToken(address, ctx.config), { headers: ctx.headers });
}
