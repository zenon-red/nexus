import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class StakeEntry extends Model {
    amount: BigNumber;
    weightedAmount: BigNumber;
    startTimestamp: number;
    expirationTimestamp: number;
    address: Address;
    id: Hash;
    constructor(amount: BigNumber, weightedAmount: BigNumber, startTimestamp: number, expirationTimestamp: number, address: Address, id: Hash);
    static fromJson(json: {
        [key: string]: any;
    }): StakeEntry;
}
export declare class StakeList extends Model {
    totalAmount: number;
    totalWeightedAmount: number;
    count: number;
    list: Array<StakeEntry>;
    constructor(totalAmount: number, totalWeightedAmount: number, count: number, list: Array<StakeEntry>);
    static fromJson(json: {
        [key: string]: any;
    }): StakeList;
}
//# sourceMappingURL=stake.d.ts.map