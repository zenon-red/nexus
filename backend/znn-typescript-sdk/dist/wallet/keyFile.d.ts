import { KeyStore } from "./keyStore.js";
export declare class KeyFile {
    private readonly password;
    private static readonly DEFAULT_CONFIG;
    constructor(password: string);
    static setPassword(password: string): KeyFile;
    encrypt(keyStore: KeyStore): Promise<KeyFileEncryptedData>;
    decrypt(json: KeyFileEncryptedData): Promise<KeyStore>;
    private hashPassword;
}
export interface KeyFileEncryptedData {
    baseAddress: string;
    crypto: {
        argon2Params: {
            salt: string;
        };
        cipherData: string;
        cipherName: string;
        kdf: string;
        nonce: string;
    };
    timestamp: number;
    version: number;
}
//# sourceMappingURL=keyFile.d.ts.map