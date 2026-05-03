import { Address } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class SentinelInfo extends Model {
    owner: Address;
    registrationTimestamp: number;
    isRevocable: boolean;
    revokeCooldown: number;
    active: boolean;
    constructor(owner: Address, registrationTimestamp: number, isRevocable: boolean, revokeCooldown: number, active: boolean);
    static fromJson(json: {
        [key: string]: any;
    }): SentinelInfo;
}
export declare class SentinelInfoList extends Model {
    count: number;
    list: Array<SentinelInfo>;
    constructor(count: number, list: Array<SentinelInfo>);
    static fromJson(json: {
        [key: string]: any;
    }): SentinelInfoList;
}
//# sourceMappingURL=sentinel.d.ts.map