import { importPKCS8, SignJWT } from "jose";
import type { KeyLike } from "jose";
import type { BackendConfig } from "./config.ts";
import type { TokenResponse } from "./types.ts";

let cachedPrivateKey: KeyLike | null = null;
let cachedPrivateKeyPem: string | null = null;

async function getPrivateKey(config: BackendConfig): Promise<KeyLike> {
  const pem = config.jwtPrivateKey;
  if (!pem) throw new Error("JWT_PRIVATE_KEY not set");

  if (cachedPrivateKey && cachedPrivateKeyPem === pem) return cachedPrivateKey;

  cachedPrivateKey = await importPKCS8(pem, "ES256");
  cachedPrivateKeyPem = pem;
  return cachedPrivateKey;
}

export async function getJwks(config: BackendConfig): Promise<{ keys: unknown[] }> {
  const publicKeyPem = config.jwtPublicKey;
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
      kid: config.jwtKeyId,
      use: "sig",
      alg: "ES256",
      crv: "P-256",
      x: jwk.x,
      y: jwk.y,
    }],
  };
}

export function getDiscoveryDocument(config: BackendConfig) {
  return {
    issuer: config.issuerUrl,
    wallet_challenge_endpoint: `${config.issuerUrl}/auth/challenge`,
    token_endpoint: `${config.issuerUrl}/auth/token`,
    jwks_uri: `${config.issuerUrl}/.well-known/jwks.json`,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["ES256"],
    grant_types_supported: [config.walletSignatureGrant],
  };
}

export async function issueToken(address: string, config: BackendConfig): Promise<TokenResponse> {
  const privateKey = await getPrivateKey(config);
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({ zenon_address: address })
    .setProtectedHeader({ alg: "ES256", kid: config.jwtKeyId })
    .setJti(crypto.randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(now + config.tokenTtl)
    .setIssuer(config.issuerUrl)
    .setSubject(address)
    .setAudience("spacetimedb")
    .sign(privateKey);

  return {
    access_token: jwt,
    id_token: jwt,
    token_type: "Bearer",
    expires_in: config.tokenTtl,
    scope: "openid profile",
  };
}
