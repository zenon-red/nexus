import type { BackendConfig } from "../config.ts";

export async function handleHealth(headers: HeadersInit, kv: Deno.Kv, config: BackendConfig): Promise<Response> {
  try {
    await kv.get(["__health_check__"]);
    return Response.json({
      status: "ok",
      timestamp: Math.floor(Date.now() / 1000),
      kv: "connected",
      version: config.version,
      commit: config.commitSha,
    }, { headers });
  } catch {
    return Response.json({
      status: "degraded",
      timestamp: Math.floor(Date.now() / 1000),
      kv: "error",
      version: config.version,
    }, { status: 503, headers });
  }
}
