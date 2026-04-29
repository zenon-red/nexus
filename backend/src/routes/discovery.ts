import { getDiscoveryDocument, getJwks } from "../oidc.ts";
import type { BackendConfig } from "../config.ts";

export function handleDiscovery(headers: HeadersInit, config: BackendConfig): Response {
  return Response.json(getDiscoveryDocument(config), { headers });
}

export async function handleJwks(headers: HeadersInit, config: BackendConfig): Promise<Response> {
  return Response.json(await getJwks(config), { headers });
}
