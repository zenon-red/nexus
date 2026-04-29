const MAX_BODY_BYTES = 1024;

export function corsHeaders(corsOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function jsonHeaders(corsOrigin: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...corsHeaders(corsOrigin),
  };
}

function isJsonContentType(req: Request): boolean {
  const header = req.headers.get("content-type");
  if (!header) return false;
  const mediaType = header.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

async function readBoundedText(req: Request): Promise<{ text: string } | { overflow: true }> {
  if (!req.body) {
    return { text: "" };
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let cancelled = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        cancelled = true;
        return { overflow: true };
      }

      chunks.push(value);
    }
  } finally {
    if (!cancelled) reader.releaseLock();
  }

  const decoder = new TextDecoder();
  return { text: chunks.map((c) => decoder.decode(c, { stream: true })).join("") + decoder.decode() };
}

export async function parseJsonBody(
  req: Request,
  headers: HeadersInit,
): Promise<{ data: Record<string, unknown> } | { error: Response }> {
  if (!isJsonContentType(req)) {
    return {
      error: Response.json(
        { error: "invalid_content_type", message: "Content-Type must be application/json" },
        { status: 415, headers },
      ),
    };
  }

  const readResult = await readBoundedText(req);
  if ("overflow" in readResult) {
    return {
      error: Response.json(
        { error: "payload_too_large", message: "Request body too large" },
        { status: 413, headers },
      ),
    };
  }

  try {
    const body = JSON.parse(readResult.text);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {
        error: Response.json(
          { error: "invalid_request", message: "Request body must be a JSON object" },
          { status: 400, headers },
        ),
      };
    }

    return { data: body as Record<string, unknown> };
  } catch {
    return {
      error: Response.json(
        { error: "invalid_json", message: "Request body must be valid JSON" },
        { status: 400, headers },
      ),
    };
  }
}

export function getStringField(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}
