import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class UncollectedReward extends Model {
    address: Address;
    znnAmount: BigNumber;
    qsrAmount: BigNumber;
    constructor(address: Address, znnAmount: BigNumber, qsrAmount: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): UncollectedReward;
}
export declare class RewardHistoryEntry extends Model {
    epoch: number;
    znnAmount: BigNumber;
    qsrAmount: BigNumber;
    constructor(epoch: number, znnAmount: BigNumber, qsrAmount: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): RewardHistoryEntry;
}
export declare class RewardHistoryList extends Model {
    count: number;
    list: Array<RewardHistoryEntry>;
    constructor(count: number, list: Array<RewardHistoryEntry>);
    static fromJson(json: {
        [key: string]: any;
    }): RewardHistoryList;
}
export declare class VoteBreakdown extends Model {
    id: Hash;
    yes: number;
    no: number;
    total: number;
    constructor(id: Hash, yes: number, no: number, total: number);
    static fromJson(json: {
        [key: string]: any;
    }): VoteBreakdown;
}
export declare class PillarVote extends Model {
    id: Hash;
    name: string;
    vote: number;
    constructor(id: Hash, name: string, vote: number);
    static fromJson(json: {
        [key: string]: any;
    }): PillarVote;
}
export declare class SecurityInfo extends Model {
    guardians: Array<Address>;
    guardiansVotes: Array<Address>;
    administratorDelay: number;
    softDelay: number;
    constructor(guardians: Array<Address>, guardiansVotes: Array<Address>, administratorDelay: number, softDelay: number);
    static fromJson(json: {
        [key: string]: any;
    }): SecurityInfo;
}
export declare class RewardDeposit extends Model {
    address: Address;
    znnAmount: BigNumber;
    qsrAmount: BigNumber;
    constructor(address: Address, znnAmount: BigNumber, qsrAmount: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): RewardDeposit;
}
export declare class TimeChallengeInfo extends Model {
    methodName: string;
    paramsHash: Hash;
    challengeStartHeight: number;
    constructor(methodName: string, paramsHash: Hash, challengeStartHeight: number);
    static fromJson(json: {
        [key: string]: any;
    }): TimeChallengeInfo;
}
//# sourceMappingURL=common.d.ts.map