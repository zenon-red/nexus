import { Buffer } from "buffer";
import * as crypto from "crypto";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2";
import { derivePath, getPublicKey } from "ed25519-hd-key";
import { sha3_256 } from "@noble/hashes/sha3";
import { arrayify } from "../utilities/bytes.js";
// Set SHA-512 hash function for @noble/ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
export class Crypto {
    static getPublicKey(privateKey) {
        return getPublicKey(privateKey, false);
    }
    static deriveKey(path, seed) {
        return derivePath(path, seed).key;
    }
    static sign(message, privateKey) {
        const signature = ed.sign(message, privateKey.toString("hex"));
        return Buffer.from(signature);
    }
    static async verify(signature, message, publicKey) {
        return ed.verifyAsync(signature, message, publicKey);
    }
    static digest(data) {
        return sha3_256.create().update(data).digest();
    }
    static keccak256(data) {
        const dataArray = arrayify(data);
        const digest = sha3_256.create().update(dataArray).digest();
        return "0x" + Buffer.from(digest).toString("hex");
    }
    static randomBytes(length = 32) {
        return crypto.randomBytes(length);
    }
}
//# sourceMappingURL=crypto.js.map