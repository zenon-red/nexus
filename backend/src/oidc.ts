import { importPKCS8, SignJWT } from "jose";
import type { KeyLike } from "jose";
import type { TokenResponse } from "./types.ts";
import {
  ISSUER_URL,
  JWT_KEY_ID,
  TOKEN_TTL,
  WALLET_SIGNATURE_GRANT,
} from "./config.ts";

let cachedPrivateKey: KeyLike | null = null;

async function getPrivateKey(): Promise<KeyLike> {
  if (cachedPrivateKey) return cachedPrivateKey;

  const pem = Deno.env.get("JWT_PRIVATE_KEY");
  if (!pem) throw new Error("JWT_PRIVATE_KEY not set");

  cachedPrivateKey = await importPKCS8(pem, "ES256");
  return cachedPrivateKey;
}

export async function getJwks(): Promise<{ keys: unknown[] }> {
  const publicKeyPem = Deno.env.get("JWT_PUBLIC_KEY");
  if (!publicKeyPem) throw new Error("JWT_PUBLIC_KEY not set");

  const pemContents = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" },
    true,
    ["verify"],
  );

  const jwk = await crypto.subtle.exportKey("jwk", key);

  return {
    keys: [{
      kty: "EC",
      kid: JWT_KEY_ID,
      use: "sig",
      alg: "ES256",
      crv: "P-256",
      x: jwk.x,
      y: jwk.y,
    }],
  };
}

export function getDiscoveryDocument() {
  return {
    issuer: ISSUER_URL,
    wallet_challenge_endpoint: `${ISSUER_URL}/auth/challenge`,
    token_endpoint: `${ISSUER_URL}/auth/token`,
    jwks_uri: `${ISSUER_URL}/.well-known/jwks.json`,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["ES256"],
    grant_types_supported: [WALLET_SIGNATURE_GRANT],
  };
}

export async function issueToken(address: string): Promise<TokenResponse> {
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({ zenon_address: address })
    .setProtectedHeader({ alg: "ES256", kid: JWT_KEY_ID })
    .setJti(crypto.randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL)
    .setIssuer(ISSUER_URL)
    .setSubject(address)
    .setAudience("spacetimedb")
    .sign(privateKey);

  return {
    access_token: jwt,
    id_token: jwt,
    token_type: "Bearer",
    expires_in: TOKEN_TTL,
    scope: "openid profile",
  };
}
