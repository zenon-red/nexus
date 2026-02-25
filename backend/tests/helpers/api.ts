import type { ChallengeResponse, TokenResponse } from "./types.ts";

export async function requestChallenge(
  apiUrl: string,
  address: string,
): Promise<{ status: number; data: ChallengeResponse | Record<string, unknown> }> {
  const res = await fetch(`${apiUrl}/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  return { status: res.status, data: await res.json() };
}

export async function requestToken(
  apiUrl: string,
  payload: Record<string, unknown>,
): Promise<{ status: number; data: TokenResponse | Record<string, unknown> }> {
  const res = await fetch(`${apiUrl}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return { status: res.status, data: await res.json() };
}
