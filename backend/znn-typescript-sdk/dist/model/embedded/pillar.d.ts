import { Address } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class PillarInfo extends Model {
    name: string;
    rank: number;
    type: number;
    ownerAddress: Address;
    producerAddress: Address;
    withdrawAddress: Address;
    giveMomentumRewardPercentage: number;
    giveDelegateRewardPercentage: number;
    isRevocable: boolean;
    revokeCooldown: number;
    revokeTimestamp: number;
    currentStats: PillarEpochStats;
    weight: BigNumber;
    static unknownType: number;
    static legacyPillarType: number;
    static regularPillarType: number;
    constructor(name: string, rank: number, type: number, ownerAddress: Address, producerAddress: Address, withdrawAddress: Address, giveMomentumRewardPercentage: number, giveDelegateRewardPercentage: number, isRevocable: boolean, revokeCooldown: number, revokeTimestamp: number, currentStats: PillarEpochStats, weight: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): PillarInfo;
}
export declare class PillarInfoList extends Model {
    count: number;
    list: Array<PillarInfo>;
    constructor(count: number, list: Array<PillarInfo>);
    static fromJson(json: {
        [key: string]: any;
    }): PillarInfoList;
}
export declare class PillarEpochStats extends Model {
    producedMomentums: number;
    expectedMomentums: number;
    constructor(producedMomentums: number, expectedMomentums: number);
    static fromJson(json: {
        [key: string]: any;
    }): PillarEpochStats;
}
export declare class PillarEpochHistory extends Model {
    name: string;
    epoch: number;
    giveBlockRewardPercentage: number;
    giveDelegateRewardPercentage: number;
    producedBlockNum: number;
    expectedBlockNum: number;
    weight: BigNumber;
    constructor(name: string, epoch: number, giveBlockRewardPercentage: number, giveDelegateRewardPercentage: number, producedBlockNum: number, expectedBlockNum: number, weight: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): PillarEpochHistory;
}
export declare class PillarEpochHistoryList extends Model {
    count: number;
    list: Array<PillarEpochHistory>;
    constructor(count: number, list: Array<PillarEpochHistory>);
    static fromJson(json: {
        [key: string]: any;
    }): PillarEpochHistoryList;
}
export declare class DelegationInfo extends Model {
    name: string;
    status: number;
    weight: BigNumber;
    constructor(name: string, status: number, weight: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): DelegationInfo;
    isPillarActive(): boolean;
}
//# sourceMappingURL=pillar.d.ts.map