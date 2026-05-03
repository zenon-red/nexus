import { Buffer } from "buffer";
import { hexlify } from "../../utilities/bytes.js";
import { toUtf8Bytes } from "../../utilities/utf8.js";
import { Crypto } from "../../crypto/crypto.js";
/**
 * Represents a cryptographic hash with utility methods for manipulation and validation.
 */
export class Hash {
    constructor(core) {
        this.core = core;
    }
    static parse(hash) {
        if (hash.length != 2 * Hash.coreSize) {
            throw Error("invalid hash length");
        }
        return new Hash(Buffer.from(hash, "hex"));
    }
    static digest(data) {
        const digest = Crypto.digest(data);
        return new Hash(Buffer.from(digest));
    }
    static id(text) {
        return Crypto.keccak256(toUtf8Bytes(text)).toString();
    }
    static isHash(value) {
        return (value.constructor.name === "Hash");
    }
    getBytes() {
        return this.core;
    }
    toString() {
        if (typeof (this.core) === typeof ("string")) {
            return this.core.toString();
        }
        else {
            return hexlify(this.core).substring(2);
        }
    }
}
Hash.coreSize = 32;
const EMPTY_HASH = Hash.parse("0000000000000000000000000000000000000000000000000000000000000000");
export { EMPTY_HASH };
//# sourceMappingURL=hash.js.map