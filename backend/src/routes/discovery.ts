import { getDiscoveryDocument, getJwks } from "../oidc.ts";

export function handleDiscovery(headers: HeadersInit): Response {
  return Response.json(getDiscoveryDocument(), { headers });
}

export async function handleJwks(headers: HeadersInit): Promise<Response> {
  return Response.json(await getJwks(), { headers });
}
