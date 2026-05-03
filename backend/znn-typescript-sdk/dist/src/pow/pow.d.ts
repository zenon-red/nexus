/**
 * Proof of Work module for generating PoW nonces
 * Uses WebAssembly compiled from znn-pow-links-cpp
 */
/**
 * Initialize the PoW WASM module.
 * Must be called before using generate() or benchmark().
 * In browser environments, call Zenon.setPowBasePath() first if needed.
 */
export declare function init(): Promise<void>;
/**
 * Generate a PoW nonce for the given hash and difficulty
 *
 * @param hash - 32-byte hash as hex string or Uint8Array
 * @param difficulty - PoW difficulty level (higher = more computation)
 * @returns 8-byte nonce as hex string
 *
 * @example
 * ```typescript
 * await initPoW();
 * const hash = "a1b2c3d4..."; // 64 character hex string (32 bytes)
 * const nonce = await generatePoW(hash, 75000);
 * ```
 */
export declare function generate(hash: string | Uint8Array, difficulty: number): Promise<string>;
/**
 * Benchmark the PoW implementation with a random hash
 * Useful for testing performance
 *
 * @param difficulty - PoW difficulty level
 * @returns 8-byte nonce as hex string
 *
 * @example
 * ```typescript
 * await initPoW();
 * const start = Date.now();
 * await benchmarkPoW(75000);
 * console.log(`PoW took ${Date.now() - start}ms`);
 * ```
 */
export declare function benchmark(difficulty: number): Promise<string>;
/**
 * Check if the PoW module has been initialized
 */
export declare function isInitialized(): boolean;
export { init as initPoW };
//# sourceMappingURL=pow.d.ts.map