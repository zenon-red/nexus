import { Buffer } from "buffer";
import * as crypto from "crypto";
import { Crypto } from "../crypto/crypto.js";
import { isBrowser } from "../utilities/global.js";
export class Encryptor {
    constructor(key) {
        this.algorithm = "aes-256-gcm";
        this.aadString = "zenon";
        this.nonceLength = 12;
        if (key.length !== 32) {
            throw new Error(`Invalid key length. Expected 32 bytes, got ${key.length}`);
        }
        this.key = key;
        this.aad = Buffer.from(this.aadString, "utf8");
        this.setEncryptionDriver();
    }
    static setKey(key) {
        return new Encryptor(key);
    }
    encrypt(data) {
        const nonce = Crypto.randomBytes(this.nonceLength);
        const cipher = this.driver.createCipheriv(this.algorithm, this.key, nonce);
        cipher.setAAD(this.aad);
        let encrypted = cipher.update(Buffer.from(data, "hex"), undefined, "hex");
        encrypted += cipher.final("hex");
        encrypted += cipher.getAuthTag().toString("hex");
        return [encrypted, nonce];
    }
    decrypt(encrypted, iv, authTag) {
        const decipher = this.driver.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAAD(this.aad);
        decipher.setAuthTag(authTag);
        const decrypted = decipher.update(encrypted);
        return Buffer.concat([decrypted, decipher.final()]);
    }
    setEncryptionDriver() {
        if (this.driver) {
            return;
        }
        if (isBrowser()) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            this.driver = require("crypto-browserify");
        }
        else {
            this.driver = crypto;
        }
    }
}
//# sourceMappingURL=encryptor.js.map