import { Buffer } from "buffer";
import { Address } from "../model/primitives/address.js";
import { Crypto } from "../crypto/crypto.js";
/**
 * Represents a cryptographic key pair, including a private key, public key,
 * and associated address. Provides methods for retrieving keys,
 * generating a public address, and signing data.
 */
export class KeyPair {
    constructor(privateKey) {
        if (!privateKey || privateKey.length === 0) {
            throw new Error("Invalid private key");
        }
        this.privateKey = Buffer.from(privateKey);
        this.publicKey = Crypto.getPublicKey(this.privateKey);
        this.address = Address.fromPublicKey(this.publicKey);
    }
    static fromPrivateKey(privateKey) {
        return new KeyPair(privateKey);
    }
    getPrivateKey() {
        return this.privateKey;
    }
    getPublicKey() {
        return this.publicKey;
    }
    getAddress() {
        return this.address;
    }
    sign(data) {
        return Crypto.sign(data, this.privateKey);
    }
}
//# sourceMappingURL=keyPair.js.map