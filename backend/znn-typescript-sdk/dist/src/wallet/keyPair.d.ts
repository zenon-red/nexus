import { Buffer } from "buffer";
import { Address } from "../model/primitives/address.js";
/**
 * Represents a cryptographic key pair, including a private key, public key,
 * and associated address. Provides methods for retrieving keys,
 * generating a public address, and signing data.
 */
export declare class KeyPair {
    privateKey: Buffer;
    publicKey: Buffer;
    address: Address;
    constructor(privateKey: Buffer);
    static fromPrivateKey(privateKey: Buffer): KeyPair;
    getPrivateKey(): Buffer;
    getPublicKey(): Buffer;
    getAddress(): Address;
    sign(data: Buffer): Buffer;
}
//# sourceMappingURL=keyPair.d.ts.map