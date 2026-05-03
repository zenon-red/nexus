import { Address } from "../model/primitives/address.js";
import { KeyPair } from "./keyPair.js";
export declare class KeyStore {
    baseAddress: Address;
    mnemonic: string;
    entropy: string;
    seed: string;
    constructor(mnemonic: string);
    static fromMnemonic(mnemonic: string): KeyStore;
    static fromEntropy(initialEntropy: string): KeyStore;
    static newRandom(): KeyStore;
    getKeyPair(index?: number): KeyPair;
    getBaseAddress(): Address;
}
//# sourceMappingURL=keyStore.d.ts.map