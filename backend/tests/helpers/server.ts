import { assert } from "@std/assert";

export interface TestServer {
  apiUrl: string;
  server: Deno.HttpServer<Deno.NetAddr>;
  kv: Deno.Kv;
}

function toPem(type: "PUBLIC KEY" | "PRIVATE KEY", data: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----`;
}

async function generateJwtKeyPair(): Promise<{ privatePem: string; publicPem: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  const privatePkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicSpki = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privatePem: toPem("PRIVATE KEY", privatePkcs8),
    publicPem: toPem("PUBLIC KEY", publicSpki),
  };
}

async function waitForHealth(url: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // Retry until ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Test server did not become healthy in time");
}

export async function startTestServer(): Promise<TestServer> {
  const { privatePem, publicPem } = await generateJwtKeyPair();

  Deno.env.set("JWT_PRIVATE_KEY", privatePem);
  Deno.env.set("JWT_PUBLIC_KEY", publicPem);
  Deno.env.set("JWT_KEY_ID", "test-key-id");
  Deno.env.set("TOKEN_TTL", "3600");
  Deno.env.set("CHALLENGE_TTL", "300");
  Deno.env.set("RATE_LIMIT_REQUESTS", "10");
  Deno.env.set("RATE_LIMIT_WINDOW", "60");
  Deno.env.set("TRUST_PROXY", "false");
  Deno.env.set("CORS_ORIGIN", "*");

  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const addr = listener.addr;
  listener.close();

  assert(addr.transport === "tcp");
  const apiUrl = `http://${addr.hostname}:${addr.port}`;

  Deno.env.set("ISSUER_URL", apiUrl);

  const kv = await Deno.openKv();
  const { createHandler } = await import("../../src/handler.ts");
  const server = Deno.serve({ hostname: addr.hostname, port: addr.port }, createHandler(kv));

  await waitForHealth(apiUrl);

  return { apiUrl, server, kv };
}

export async function stopTestServer(testServer: TestServer | null): Promise<void> {
  await testServer?.server.shutdown();
  testServer?.kv.close();
}
