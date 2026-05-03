import { Buffer } from "buffer";
export declare class TokenStandard {
    core: Buffer;
    static prefix: string;
    static coreSize: number;
    constructor(core: Buffer);
    static parse(zts: string): TokenStandard;
    static fromCore(zts: Buffer | Uint8Array): TokenStandard;
    static isTokenStandard(value: any): boolean;
    getBytes(): Buffer;
    toString(): string;
}
declare const ZNN_ZTS: TokenStandard;
declare const QSR_ZTS: TokenStandard;
declare const EMPTY_ZTS: TokenStandard;
export { ZNN_ZTS, QSR_ZTS, EMPTY_ZTS };
//# sourceMappingURL=tokenStandard.d.ts.map