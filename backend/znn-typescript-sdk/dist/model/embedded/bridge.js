import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { TimeChallengeInfo } from "./common.js";
export class BridgeInfo extends Model {
    constructor(administrator, compressedTssECDSAPubKey, decompressedTssECDSAPubKey, allowKeyGen, halted, unhaltedAt, unhaltDurationInMomentums, tssNonce, metadata) {
        super();
        this.administrator = administrator;
        this.compressedTssECDSAPubKey = compressedTssECDSAPubKey;
        this.decompressedTssECDSAPubKey = decompressedTssECDSAPubKey;
        this.allowKeyGen = allowKeyGen;
        this.halted = halted;
        this.unhaltedAt = unhaltedAt;
        this.unhaltDurationInMomentums = unhaltDurationInMomentums;
        this.tssNonce = tssNonce;
        this.metadata = metadata;
    }
    static fromJson(json) {
        return new BridgeInfo(Address.parse(json.administrator), json.compressedTssECDSAPubKey, json.decompressedTssECDSAPubKey, json.allowKeyGen, json.halted, json.unhaltedAt, json.unhaltDurationInMomentums, json.tssNonce, json.metadata);
    }
}
export class OrchestratorInfo extends Model {
    constructor(windowSize, keyGenThreshold, confirmationsToFinality, estimatedMomentumTime, allowKeyGenHeight) {
        super();
        this.windowSize = windowSize;
        this.keyGenThreshold = keyGenThreshold;
        this.confirmationsToFinality = confirmationsToFinality;
        this.estimatedMomentumTime = estimatedMomentumTime;
        this.allowKeyGenHeight = allowKeyGenHeight;
    }
    static fromJson(json) {
        return new OrchestratorInfo(json.windowSize, json.keyGenThreshold, json.confirmationsToFinality, json.estimatedMomentumTime, json.allowKeyGenHeight);
    }
}
export class TokenPair extends Model {
    constructor(tokenStandard, tokenAddress, bridgeable, redeemable, owned, minAmount, feePercentage, redeemDelay, metadata) {
        super();
        this.tokenStandard = tokenStandard;
        this.tokenAddress = tokenAddress;
        this.bridgeable = bridgeable;
        this.redeemable = redeemable;
        this.owned = owned;
        this.minAmount = minAmount;
        this.feePercentage = feePercentage;
        this.redeemDelay = redeemDelay;
        this.metadata = metadata;
    }
    static fromJson(json) {
        return new TokenPair(TokenStandard.parse(json.tokenStandard), json.tokenAddress, json.bridgeable, json.redeemable, json.owned, BigNumber.from(json.minAmount.toString()), json.feePercentage, json.redeemDelay, json.metadata);
    }
}
export class BridgeNetworkInfo extends Model {
    constructor(networkClass, chainId, name, contractAddress, metadata, tokenPairs) {
        super();
        this.networkClass = networkClass;
        this.chainId = chainId;
        this.name = name;
        this.contractAddress = contractAddress;
        this.metadata = metadata;
        this.tokenPairs = tokenPairs;
    }
    static fromJson(json) {
        return new BridgeNetworkInfo(json.networkClass, json.chainId, json.name, json.contractAddress, json.metadata, json.tokenPairs != null ? json.tokenPairs.map(TokenPair.fromJson) : []);
    }
}
export class BridgeNetworkInfoList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new BridgeNetworkInfoList(json.count, json.list.map(BridgeNetworkInfo.fromJson));
    }
}
export class WrapTokenRequest extends Model {
    constructor(networkClass, chainId, id, toAddress, tokenStandard, tokenAddress, amount, fee, signature, creationMomentumHeight, confirmationsToFinality) {
        super();
        this.networkClass = networkClass;
        this.chainId = chainId;
        this.id = id;
        this.toAddress = toAddress;
        this.tokenStandard = tokenStandard;
        this.tokenAddress = tokenAddress;
        this.amount = amount;
        this.fee = fee;
        this.signature = signature;
        this.creationMomentumHeight = creationMomentumHeight;
        this.confirmationsToFinality = confirmationsToFinality;
    }
    static fromJson(json) {
        return new WrapTokenRequest(json.networkClass, json.chainId, Hash.parse(json.id), json.toAddress, TokenStandard.parse(json.tokenStandard), json.tokenAddress, BigNumber.from(json.amount.toString()), BigNumber.from(json.fee.toString()), json.signature, json.creationMomentumHeight, json.confirmationsToFinality);
    }
}
export class WrapTokenRequestList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new WrapTokenRequestList(json.count, json.list != null ? json.list.map(WrapTokenRequest.fromJson) : []);
    }
}
export class UnwrapTokenRequest extends Model {
    constructor(registrationMomentumHeight, networkClass, chainId, transactionHash, logIndex, toAddress, tokenAddress, tokenStandard, amount, signature, redeemed, revoked, redeemableIn) {
        super();
        this.registrationMomentumHeight = registrationMomentumHeight;
        this.networkClass = networkClass;
        this.chainId = chainId;
        this.transactionHash = transactionHash;
        this.logIndex = logIndex;
        this.toAddress = toAddress;
        this.tokenAddress = tokenAddress;
        this.tokenStandard = tokenStandard;
        this.amount = amount;
        this.signature = signature;
        this.redeemed = redeemed;
        this.revoked = revoked;
        this.redeemableIn = redeemableIn;
    }
    static fromJson(json) {
        return new UnwrapTokenRequest(json.registrationMomentumHeight, json.networkClass, json.chainId, Hash.parse(json.transactionHash), json.logIndex, Address.parse(json.toAddress), json.tokenAddress, TokenStandard.parse(json.tokenStandard), BigNumber.from(json.amount.toString()), json.signature, json.redeemed, json.revoked, json.redeemableIn);
    }
}
export class UnwrapTokenRequestList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new UnwrapTokenRequestList(json.count, json.list != null ? json.list.map(UnwrapTokenRequest.fromJson) : []);
    }
}
export class ZtsFeesInfo extends Model {
    constructor(tokenStandard, accumulatedFee) {
        super();
        this.tokenStandard = tokenStandard;
        this.accumulatedFee = accumulatedFee;
    }
    static fromJson(json) {
        return new ZtsFeesInfo(TokenStandard.parse(json.tokenStandard), BigNumber.from(json.accumulatedFee.toString()));
    }
}
export class TimeChallengesList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new TimeChallengesList(json.count, json.list.map(TimeChallengeInfo.fromJson));
    }
}
//# sourceMappingURL=bridge.js.map