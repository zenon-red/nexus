import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { TimeChallengeInfo } from "./common.js";
export declare class BridgeInfo extends Model {
    administrator: Address;
    compressedTssECDSAPubKey: string;
    decompressedTssECDSAPubKey: string;
    allowKeyGen: boolean;
    halted: boolean;
    unhaltedAt: number;
    unhaltDurationInMomentums: number;
    tssNonce: number;
    metadata: string;
    constructor(administrator: Address, compressedTssECDSAPubKey: string, decompressedTssECDSAPubKey: string, allowKeyGen: boolean, halted: boolean, unhaltedAt: number, unhaltDurationInMomentums: number, tssNonce: number, metadata: string);
    static fromJson(json: {
        [key: string]: any;
    }): BridgeInfo;
}
export declare class OrchestratorInfo extends Model {
    windowSize: number;
    keyGenThreshold: number;
    confirmationsToFinality: number;
    estimatedMomentumTime: number;
    allowKeyGenHeight: number;
    constructor(windowSize: number, keyGenThreshold: number, confirmationsToFinality: number, estimatedMomentumTime: number, allowKeyGenHeight: number);
    static fromJson(json: {
        [key: string]: any;
    }): OrchestratorInfo;
}
export declare class TokenPair extends Model {
    tokenStandard: TokenStandard;
    tokenAddress: string;
    bridgeable: boolean;
    redeemable: boolean;
    owned: boolean;
    minAmount: BigNumber;
    feePercentage: number;
    redeemDelay: number;
    metadata: string;
    constructor(tokenStandard: TokenStandard, tokenAddress: string, bridgeable: boolean, redeemable: boolean, owned: boolean, minAmount: BigNumber, feePercentage: number, redeemDelay: number, metadata: string);
    static fromJson(json: {
        [key: string]: any;
    }): TokenPair;
}
export declare class BridgeNetworkInfo extends Model {
    networkClass: number;
    chainId: number;
    name: string;
    contractAddress: string;
    metadata: string;
    tokenPairs: Array<TokenPair>;
    constructor(networkClass: number, chainId: number, name: string, contractAddress: string, metadata: string, tokenPairs: Array<TokenPair>);
    static fromJson(json: {
        [key: string]: any;
    }): BridgeNetworkInfo;
}
export declare class BridgeNetworkInfoList extends Model {
    count: number;
    list: Array<BridgeNetworkInfo>;
    constructor(count: number, list: Array<BridgeNetworkInfo>);
    static fromJson(json: {
        [key: string]: any;
    }): BridgeNetworkInfoList;
}
export declare class WrapTokenRequest extends Model {
    networkClass: number;
    chainId: number;
    id: Hash;
    toAddress: string;
    tokenStandard: TokenStandard;
    tokenAddress: string;
    amount: BigNumber;
    fee: BigNumber;
    signature: string;
    creationMomentumHeight: number;
    confirmationsToFinality: number;
    constructor(networkClass: number, chainId: number, id: Hash, toAddress: string, tokenStandard: TokenStandard, tokenAddress: string, amount: BigNumber, fee: BigNumber, signature: string, creationMomentumHeight: number, confirmationsToFinality: number);
    static fromJson(json: {
        [key: string]: any;
    }): WrapTokenRequest;
}
export declare class WrapTokenRequestList extends Model {
    count: number;
    list: Array<WrapTokenRequest>;
    constructor(count: number, list: Array<WrapTokenRequest>);
    static fromJson(json: {
        [key: string]: any;
    }): WrapTokenRequestList;
}
export declare class UnwrapTokenRequest extends Model {
    registrationMomentumHeight: number;
    networkClass: number;
    chainId: number;
    transactionHash: Hash;
    logIndex: number;
    toAddress: Address;
    tokenAddress: string;
    tokenStandard: TokenStandard;
    amount: BigNumber;
    signature: string;
    redeemed: number;
    revoked: number;
    redeemableIn: number;
    constructor(registrationMomentumHeight: number, networkClass: number, chainId: number, transactionHash: Hash, logIndex: number, toAddress: Address, tokenAddress: string, tokenStandard: TokenStandard, amount: BigNumber, signature: string, redeemed: number, revoked: number, redeemableIn: number);
    static fromJson(json: {
        [key: string]: any;
    }): UnwrapTokenRequest;
}
export declare class UnwrapTokenRequestList extends Model {
    count: number;
    list: Array<UnwrapTokenRequest>;
    constructor(count: number, list: Array<UnwrapTokenRequest>);
    static fromJson(json: {
        [key: string]: any;
    }): UnwrapTokenRequestList;
}
export declare class ZtsFeesInfo extends Model {
    tokenStandard: TokenStandard;
    accumulatedFee: BigNumber;
    constructor(tokenStandard: TokenStandard, accumulatedFee: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): ZtsFeesInfo;
}
export declare class TimeChallengesList extends Model {
    count: number;
    list: Array<TimeChallengeInfo>;
    constructor(count: number, list: Array<TimeChallengeInfo>);
    static fromJson(json: {
        [key: string]: any;
    }): TimeChallengesList;
}
//# sourceMappingURL=bridge.d.ts.map