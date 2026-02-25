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

      const payload = decodeJwtPayload(tokenData.id_token);
      assertEquals(payload.sub, address);
      assertEquals(payload.zenon_address, address);
      assertExists(payload.exp);
      assertEquals(payload.iss, apiUrl);
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
  },
});
