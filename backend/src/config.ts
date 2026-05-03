import { load } from "@std/dotenv";

await load({ export: true });

export const WALLET_SIGNATURE_GRANT = "urn:zenon:params:oauth:grant-type:wallet_signature";

const denoJson = JSON.parse(await Deno.readTextFile(new URL("../deno.json", import.meta.url)));

export interface BackendConfig {
  port: number;
  issuerUrl: string;
  jwtKeyId: string;
  jwtPrivateKey: string | null;
  jwtPublicKey: string | null;
  tokenTtl: number;
  challengeTtl: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
  trustProxy: boolean;
  corsOrigin: string;
  commitSha: string;
  version: string;
  walletSignatureGrant: string;
}

function parseEnvInt(name: string, fallback: string): number {
  const raw = Deno.env.get(name) || fallback;
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error(`${name} must be a positive integer, got: ${raw}`);
  }
  return Number(raw);
}

export function loadConfig(): BackendConfig {
  const port = parseEnvInt("PORT", "3001");

  return {
    port,
    issuerUrl: Deno.env.get("ISSUER_URL") || `http://localhost:${port}`,
    jwtKeyId: Deno.env.get("JWT_KEY_ID") || "key-id-1",
    jwtPrivateKey: Deno.env.get("JWT_PRIVATE_KEY") ?? null,
    jwtPublicKey: Deno.env.get("JWT_PUBLIC_KEY") ?? null,
    tokenTtl: parseEnvInt("TOKEN_TTL", "2592000"),
    challengeTtl: parseEnvInt("CHALLENGE_TTL", "300"),
    rateLimitRequests: parseEnvInt("RATE_LIMIT_REQUESTS", "10"),
    rateLimitWindow: parseEnvInt("RATE_LIMIT_WINDOW", "60"),
    trustProxy: Deno.env.get("TRUST_PROXY") === "true",
    corsOrigin: Deno.env.get("CORS_ORIGIN") || "*",
    commitSha: Deno.env.get("COMMIT_SHA") || "unknown",
    version: denoJson.version ?? "0.0.0",
    walletSignatureGrant: WALLET_SIGNATURE_GRANT,
  };
}
