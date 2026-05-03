import { Buffer } from "buffer";
import { BytesLike } from "../utilities/bytes.js";
export declare class Crypto {
    static getPublicKey(privateKey: Buffer): Buffer;
    static deriveKey(path: string, seed: string): Buffer;
    static sign(message: Buffer, privateKey: Buffer): Buffer;
    static verify(signature: Buffer, message: Buffer, publicKey: Buffer): Promise<boolean>;
    static digest(data: Buffer): Uint8Array<ArrayBufferLike>;
    static keccak256(data: BytesLike): string;
    static randomBytes(length?: number): Buffer;
}
//# sourceMappingURL=crypto.d.ts.map