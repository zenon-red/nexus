import { assert, assertEquals, assertExists } from "@std/assert";
import { requestChallenge, requestToken } from "./helpers/api.ts";
import { decodeJwtPayload, getAddressFromPrivateKey, signChallenge } from "./helpers/crypto.ts";
import { MISMATCH_PRIVATE_KEY, TEST_PRIVATE_KEY } from "./helpers/fixtures.ts";
import { startTestServer, stopTestServer, type TestServer } from "./helpers/server.ts";
import type { ChallengeResponse, TokenResponse } from "./helpers/types.ts";

let testServer: TestServer | null = null;

Deno.test.beforeAll(async () => {
  testServer = await startTestServer();
});

Deno.test.afterAll(async () => {
  await stopTestServer(testServer);
});

Deno.test({
  name: "OIDC auth flow",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    assertExists(testServer);
    const server = testServer!;
    const apiUrl = server.apiUrl;

    await t.step("creates challenge for valid address", async () => {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const { status, data } = await requestChallenge(apiUrl, address);

      assertEquals(status, 200);
      assert("nonce" in data);
      assert("challenge" in data);
      assert("expires_at" in data);
    });

    await t.step("exchanges signed challenge for token", async () => {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const challengeResponse = await requestChallenge(apiUrl, address);
      assertEquals(challengeResponse.status, 200);

      const challengeData = challengeResponse.data as ChallengeResponse;
      const { publicKeyHex, signatureHex } = signChallenge(challengeData.challenge, TEST_PRIVATE_KEY);

      const tokenResponse = await requestToken(apiUrl, {
        address,
        public_key: publicKeyHex,
        signature: signatureHex,
        nonce: challengeData.nonce,
      });

      assertEquals(tokenResponse.status, 200);
      const tokenData = tokenResponse.data as TokenResponse;
      assertEquals(tokenData.token_type, "Bearer");
      assertEquals(tokenData.scope, "openid profile");
      assert(tokenData.expires_in > 0);
      assert(tokenData.access_token.length > 0);
      assert(tokenData.id_token.length > 0);

      const payload = decodeJwtPayload(tokenData.access_token);
      assertEquals(payload.sub, address);
      assertEquals(payload.zenon_address, address);
      assertExists(payload.exp);
      assertEquals(payload.iss, apiUrl);

      const idPayload = decodeJwtPayload(tokenData.id_token);
      assertEquals(idPayload.sub, address);
    });

    await t.step("rejects address/public-key mismatch", async () => {
      const validAddress = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const challengeResponse = await requestChallenge(apiUrl, validAddress);
      assertEquals(challengeResponse.status, 200);

      const challengeData = challengeResponse.data as ChallengeResponse;
      const { publicKeyHex, signatureHex } = signChallenge(challengeData.challenge, MISMATCH_PRIVATE_KEY);

      const tokenResponse = await requestToken(apiUrl, {
        address: validAddress,
        public_key: publicKeyHex,
        signature: signatureHex,
        nonce: challengeData.nonce,
      });

      assertEquals(tokenResponse.status, 401);
      assertEquals((tokenResponse.data as { error?: string }).error, "address_key_mismatch");
    });

    await t.step("rejects malformed json body", async () => {
      const res = await fetch(`${apiUrl}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      });

      assertEquals(res.status, 400);
      const data = await res.json();
      assertEquals(data.error, "invalid_json");
    });

    await t.step("rejects replayed nonce", async () => {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const challengeResponse = await requestChallenge(apiUrl, address);
      assertEquals(challengeResponse.status, 200);

      const challengeData = challengeResponse.data as ChallengeResponse;
      const { publicKeyHex, signatureHex } = signChallenge(challengeData.challenge, TEST_PRIVATE_KEY);

      const payload = {
        address,
        public_key: publicKeyHex,
        signature: signatureHex,
        nonce: challengeData.nonce,
      };

      const first = await requestToken(apiUrl, payload);
      assertEquals(first.status, 200);

      const second = await requestToken(apiUrl, payload);
      assertEquals(second.status, 400);
      assertEquals((second.data as { error?: string }).error, "expired_nonce");
    });

    await t.step("rejects invalid address format", async () => {
      const { status, data } = await requestChallenge(apiUrl, "not-a-valid-address");
      assertEquals(status, 400);
      assertEquals((data as { error?: string }).error, "invalid_address");
    });

    await t.step("rejects missing nonce field", async () => {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const { publicKeyHex, signatureHex } = signChallenge("dummy", TEST_PRIVATE_KEY);

      const { status, data } = await requestToken(apiUrl, {
        address,
        public_key: publicKeyHex,
        signature: signatureHex,
      });

      assertEquals(status, 400);
      assertEquals((data as { error?: string }).error, "invalid_nonce");
    });

    await t.step("rejects invalid public key format", async () => {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const challengeResponse = await requestChallenge(apiUrl, address);
      const challengeData = challengeResponse.data as ChallengeResponse;

      const { status, data } = await requestToken(apiUrl, {
        address,
        public_key: "not-hex",
        signature: "aa".repeat(64),
        nonce: challengeData.nonce,
      });

      assertEquals(status, 400);
      assertEquals((data as { error?: string }).error, "invalid_public_key");
    });

    await t.step("rejects missing Content-Type header", async () => {
      const res = await fetch(`${apiUrl}/auth/challenge`, {
        method: "POST",
        body: JSON.stringify({ address: "z1qplaceholder" }),
      });

      assertEquals(res.status, 415);
      const data = await res.json();
      assertEquals(data.error, "invalid_content_type");
    });

    await t.step("concurrent nonce reuse: only one succeeds", async () => {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const challengeResponse = await requestChallenge(apiUrl, address);
      assertEquals(challengeResponse.status, 200);

      const challengeData = challengeResponse.data as ChallengeResponse;
      const { publicKeyHex, signatureHex } = signChallenge(challengeData.challenge, TEST_PRIVATE_KEY);

      const payload = {
        address,
        public_key: publicKeyHex,
        signature: signatureHex,
        nonce: challengeData.nonce,
      };

      const [res1, res2] = await Promise.all([
        requestToken(apiUrl, payload),
        requestToken(apiUrl, payload),
      ]);

      const statuses = [res1.status, res2.status].sort();
      assertEquals(statuses[0], 200);
      assertEquals(statuses[1], 400);
    });
  },
});

Deno.test({
  name: "health endpoint",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    assertExists(testServer);
    const res = await fetch(`${testServer!.apiUrl}/health`);
    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.status, "ok");
    assertEquals(data.kv, "connected");
    assert(typeof data.version === "string");
  },
});

Deno.test({
  name: "KvRateLimiter enforces limits",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const { KvRateLimiter } = await import("../src/rate-limit.ts");

    const kvPath = await Deno.makeTempFile({ suffix: ".kv" });
    const kv = await Deno.openKv(kvPath);
    try {
      const limiter = new KvRateLimiter(kv, 2, 60);

      const r1 = await limiter.check("test-ip");
      const r2 = await limiter.check("test-ip");
      const r3 = await limiter.check("test-ip");

      assertEquals(r1.allowed, true);
      assertEquals(r1.remaining, 1);
      assertEquals(r2.allowed, true);
      assertEquals(r2.remaining, 0);
      assertEquals(r3.allowed, false);
      assertEquals(r3.remaining, 0);
    } finally {
      kv.close();
      await Deno.remove(kvPath);
    }
  },
});

Deno.test({
  name: "token endpoint returns 429 when rate limited",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const assert429Server = await startTestServer({ rateLimitRequests: 2 });
    try {
      const address = getAddressFromPrivateKey(TEST_PRIVATE_KEY);
      const { publicKeyHex, signatureHex } = signChallenge("dummy", TEST_PRIVATE_KEY);

      const makeRequest = () =>
        requestToken(assert429Server.apiUrl, {
          address,
          public_key: publicKeyHex,
          signature: signatureHex,
          nonce: crypto.randomUUID(),
        });

      const res1 = await makeRequest();
      const res2 = await makeRequest();
      const res3 = await makeRequest();

      assert(res1.status !== 429, "first request should not be rate-limited");
      assert(res2.status !== 429, "second request should not be rate-limited");
      assertEquals(res3.status, 429);
      assertEquals((res3.data as { error?: string }).error, "rate_limited");
    } finally {
      await stopTestServer(assert429Server);
    }
  },
});

Deno.test({
  name: "server config is isolated per instance",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.apiUrl}/.well-known/openid-configuration`);
      assertEquals(res.status, 200);

      const data = await res.json();
      assertEquals(data.issuer, server.apiUrl);
      assertEquals(data.token_endpoint, `${server.apiUrl}/auth/token`);
    } finally {
      await stopTestServer(server);
    }
  },
});
