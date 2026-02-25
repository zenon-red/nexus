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

  async remove(nonce: string): Promise<void> {
    await this.kv.delete(["challenge", nonce]);
  }
}
