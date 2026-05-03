import { Buffer } from "buffer";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class PlasmaInfo extends Model {
    currentPlasma: number;
    maxPlasma: number;
    qsrAmount: BigNumber;
    constructor(currentPlasma: number, maxPlasma: number, qsrAmount: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): PlasmaInfo;
}
export declare class FusionEntryList extends Model {
    qsrAmount: BigNumber;
    count: number;
    list: Array<FusionEntry>;
    constructor(qsrAmount?: BigNumber, count?: number, list?: Array<FusionEntry>);
    static fromJson(json: {
        [key: string]: any;
    }): FusionEntryList;
}
export declare class FusionEntry extends Model {
    qsrAmount: BigNumber;
    beneficiary: Address;
    expirationHeight: number;
    id: Hash;
    isRevocable: boolean;
    constructor(qsrAmount: BigNumber, beneficiary: Address, expirationHeight: number, id: Hash, isRevocable: boolean);
    static fromJson(json: {
        [key: string]: any;
    }): FusionEntry;
}
export declare class GetRequiredPowParam extends Model {
    address: Address;
    blockType: number;
    toAddress: Address | undefined;
    data: Buffer | undefined;
    constructor(address: Address, blockType: number, toAddress?: Address | undefined, data?: Buffer | undefined);
    static fromJson(json: {
        [key: string]: any;
    }): GetRequiredPowParam;
}
export declare class GetRequiredPowResponse extends Model {
    availablePlasma: number;
    basePlasma: number;
    requiredDifficulty: number;
    constructor(availablePlasma: number, basePlasma: number, requiredDifficulty: number);
    static fromJson(json: {
        [key: string]: any;
    }): GetRequiredPowResponse;
}
//# sourceMappingURL=plasma.d.ts.map