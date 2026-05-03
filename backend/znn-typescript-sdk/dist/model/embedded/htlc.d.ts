import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class HtlcInfo extends Model {
    id: Hash;
    timeLocked: Address;
    hashLocked: Address;
    tokenStandard: TokenStandard;
    amount: BigNumber;
    expirationTime: number;
    hashType: number;
    keyMaxSize: number;
    hashLock: Uint8Array;
    constructor(id: Hash, timeLocked: Address, hashLocked: Address, tokenStandard: TokenStandard, amount: BigNumber, expirationTime: number, hashType: number, keyMaxSize: number, hashLock: Uint8Array);
    static fromJson(json: {
        [key: string]: any;
    }): HtlcInfo;
}
//# sourceMappingURL=htlc.d.ts.map