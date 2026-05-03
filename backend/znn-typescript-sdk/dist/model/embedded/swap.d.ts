import { Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class SwapAssetEntry extends Model {
    keyIdHash: Hash;
    qsr: BigNumber;
    znn: BigNumber;
    constructor(keyIdHash: Hash, qsr: BigNumber, znn: BigNumber);
    static fromJson(keyIdHash: Hash, json: {
        [key: string]: any;
    }): SwapAssetEntry;
}
export declare class SwapAssetList extends Model {
    list: {
        [key: string]: SwapAssetEntry;
    };
    constructor(list?: {
        [key: string]: SwapAssetEntry;
    });
    static fromJson(json: {
        [key: string]: any;
    }): SwapAssetList;
    toJson(): {
        [key: string]: any;
    };
}
export declare class SwapLegacyPillarEntry extends Model {
    numPillars: number;
    keyIdHash: Hash;
    constructor(numPillars: number, keyIdHash: Hash);
    static fromJson(json: {
        [key: string]: any;
    }): SwapLegacyPillarEntry;
}
export declare class SwapLegacyPillarList extends Model {
    list: Array<SwapLegacyPillarEntry>;
    constructor(list?: Array<SwapLegacyPillarEntry>);
    static fromJson(json: Array<{
        [key: string]: any;
    }>): SwapLegacyPillarList;
}
//# sourceMappingURL=swap.d.ts.map