import { Buffer } from "buffer";
export declare class Encryptor {
    private algorithm;
    private aadString;
    private nonceLength;
    private driver;
    private readonly key;
    private readonly aad;
    constructor(key: Buffer);
    static setKey(key: Buffer): Encryptor;
    encrypt(data: string): [string, Buffer<ArrayBufferLike>];
    decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer;
    private setEncryptionDriver;
}
//# sourceMappingURL=encryptor.d.ts.map