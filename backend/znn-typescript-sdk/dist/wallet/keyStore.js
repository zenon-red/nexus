import { Buffer } from "buffer";
import { entropyToMnemonic, mnemonicToEntropy, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { Crypto } from "../crypto/crypto.js";
import { Derivation } from "./derivation.js";
import { KeyPair } from "./keyPair.js";
export class KeyStore {
    constructor(mnemonic) {
        if (!validateMnemonic(mnemonic, wordlist)) {
            throw Error("Invalid mnemonic!");
        }
        this.mnemonic = mnemonic;
        this.entropy = Buffer.from(mnemonicToEntropy(this.mnemonic, wordlist)).toString("hex");
        this.seed = Buffer.from(mnemonicToSeedSync(this.mnemonic)).toString("hex");
        this.baseAddress = this.getKeyPair(0).getAddress();
    }
    static fromMnemonic(mnemonic) {
        if (!mnemonic || mnemonic.length === 0) { // Assuming 32 bytes = 64 hex chars
            throw new Error("Invalid mnemonic");
        }
        return new KeyStore(mnemonic);
    }
    static fromEntropy(initialEntropy) {
        if (!initialEntropy || initialEntropy.length !== 64 && initialEntropy.length !== 32) { // Assuming 32 bytes = 64 hex chars
            throw new Error("Invalid entropy");
        }
        const entropy = Buffer.from(initialEntropy, "hex");
        const mnemonic = entropyToMnemonic(new Uint8Array(entropy), wordlist);
        return new KeyStore(mnemonic);
    }
    static newRandom() {
        try {
            const entropy = Buffer.from(Crypto.randomBytes(32));
            return KeyStore.fromEntropy(entropy.toString("hex"));
        }
        catch (e) {
            throw new Error(e.toString());
        }
    }
    getKeyPair(index = 0) {
        const derivationAccount = Derivation.getDerivationAccount(index);
        const derivedKey = Crypto.deriveKey(derivationAccount, this.seed);
        return new KeyPair(derivedKey);
    }
    getBaseAddress() {
        return this.baseAddress;
    }
}
//# sourceMappingURL=keyStore.js.map