import type { ChallengeNonce } from "./types.ts";

export class ChallengeStore {
  constructor(
    private readonly kv: Deno.Kv,
    private readonly challengeTtlSeconds: number,
  ) {}

  async store(nonce: string, data: ChallengeNonce): Promise<void> {
    await this.kv.set(["challenge", nonce], data, { expireIn: this.challengeTtlSeconds * 1000 });
  }

  async get(nonce: string): Promise<ChallengeNonce | null> {
    const result = await this.kv.get<ChallengeNonce>(["challenge", nonce]);
    return result.value;
  }

  async consumeIfMatches(nonce: string, address: string): Promise<boolean> {
    const key = ["challenge", nonce];
    const entry = await this.kv.get<ChallengeNonce>(key);
    if (!entry.value || entry.value.address !== address) return false;

    const res = await this.kv.atomic()
      .check(entry)
      .delete(key)
      .commit();

    return res.ok;
  }
}
