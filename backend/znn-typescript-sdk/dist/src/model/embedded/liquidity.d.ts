import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class LiquidityInfo extends Model {
    administrator: Address;
    isHalted: boolean;
    znnReward: BigNumber;
    qsrReward: BigNumber;
    tokenTuples: Array<TokenTuple>;
    constructor(administrator: Address, isHalted: boolean, znnReward: BigNumber, qsrReward: BigNumber, tokenTuples: Array<TokenTuple>);
    static fromJson(json: {
        [key: string]: any;
    }): LiquidityInfo;
}
export declare class TokenTuple extends Model {
    tokenStandard: TokenStandard;
    znnPercentage: number;
    qsrPercentage: number;
    minAmount: BigNumber;
    constructor(tokenStandard: TokenStandard, znnPercentage: number, qsrPercentage: number, minAmount: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): TokenTuple;
}
export declare class LiquidityStakeEntry extends Model {
    amount: BigNumber;
    tokenStandard: TokenStandard;
    weightedAmount: BigNumber;
    startTime: number;
    revokeTime: number;
    expirationTime: number;
    stakeAddress: Address;
    id: Hash;
    constructor(amount: BigNumber, tokenStandard: TokenStandard, weightedAmount: BigNumber, startTime: number, revokeTime: number, expirationTime: number, stakeAddress: Address, id: Hash);
    static fromJson(json: {
        [key: string]: any;
    }): LiquidityStakeEntry;
}
export declare class LiquidityStakeList extends Model {
    totalAmount: BigNumber;
    totalWeightedAmount: BigNumber;
    count: number;
    list: Array<LiquidityStakeEntry>;
    constructor(totalAmount: BigNumber, totalWeightedAmount: BigNumber, count: number, list: Array<LiquidityStakeEntry>);
    static fromJson(json: {
        [key: string]: any;
    }): LiquidityStakeList;
}
//# sourceMappingURL=liquidity.d.ts.map