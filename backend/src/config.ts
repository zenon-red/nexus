import { load } from "@std/dotenv";

await load({ export: true });

export const PORT = parseInt(Deno.env.get("PORT") || "3001");
export const ISSUER_URL = Deno.env.get("ISSUER_URL") || `http://localhost:${PORT}`;
export const JWT_KEY_ID = Deno.env.get("JWT_KEY_ID") || "key-id-1";
export const TOKEN_TTL = parseInt(Deno.env.get("TOKEN_TTL") || "2592000");
export const CHALLENGE_TTL = parseInt(Deno.env.get("CHALLENGE_TTL") || "300");
export const RATE_LIMIT_REQUESTS = parseInt(Deno.env.get("RATE_LIMIT_REQUESTS") || "10");
export const RATE_LIMIT_WINDOW = parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "60");
export const TRUST_PROXY = Deno.env.get("TRUST_PROXY") === "true";
export const CORS_ORIGIN = Deno.env.get("CORS_ORIGIN") || "*";

export const WALLET_SIGNATURE_GRANT = "urn:zenon:params:oauth:grant-type:wallet_signature";
