export function handleHealth(headers: HeadersInit): Response {
  return Response.json({
    status: "ok",
    timestamp: Math.floor(Date.now() / 1000),
    kv: "connected",
    version: "1.0.0",
  }, { headers });
}
