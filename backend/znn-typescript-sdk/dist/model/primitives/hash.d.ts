import { Buffer } from "buffer";
/**
 * Represents a cryptographic hash with utility methods for manipulation and validation.
 */
export declare class Hash {
    core: Buffer;
    static coreSize: number;
    constructor(core: Buffer);
    static parse(hash: string): Hash;
    static digest(data: Buffer): Hash;
    static id(text: string): string;
    static isHash(value: any): boolean;
    getBytes(): Buffer;
    toString(): string;
}
declare const EMPTY_HASH: Hash;
export { EMPTY_HASH };
//# sourceMappingURL=hash.d.ts.map