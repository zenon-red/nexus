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

export async function parseJsonBody(
  req: Request,
  headers: HeadersInit,
): Promise<{ data: Record<string, unknown> } | { error: Response }> {
  try {
    const body = await req.json();
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
