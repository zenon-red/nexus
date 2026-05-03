import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";
export class LiquidityInfo extends Model {
    constructor(administrator, isHalted, znnReward, qsrReward, tokenTuples) {
        super();
        this.administrator = administrator;
        this.isHalted = isHalted;
        this.znnReward = znnReward;
        this.qsrReward = qsrReward;
        this.tokenTuples = tokenTuples;
    }
    static fromJson(json) {
        return new LiquidityInfo(Address.parse(json.administrator), json.isHalted, BigNumber.from(json.znnReward.toString()), BigNumber.from(json.qsrReward.toString()), json.tokenTuples.map(TokenTuple.fromJson));
    }
}
export class TokenTuple extends Model {
    constructor(tokenStandard, znnPercentage, qsrPercentage, minAmount) {
        super();
        this.tokenStandard = tokenStandard;
        this.znnPercentage = znnPercentage;
        this.qsrPercentage = qsrPercentage;
        this.minAmount = minAmount;
    }
    static fromJson(json) {
        return new TokenTuple(TokenStandard.parse(json.tokenStandard), json.znnPercentage, json.qsrPercentage, BigNumber.from(json.minAmount.toString()));
    }
}
export class LiquidityStakeEntry extends Model {
    constructor(amount, tokenStandard, weightedAmount, startTime, revokeTime, expirationTime, stakeAddress, id) {
        super();
        this.amount = amount;
        this.tokenStandard = tokenStandard;
        this.weightedAmount = weightedAmount;
        this.startTime = startTime;
        this.revokeTime = revokeTime;
        this.expirationTime = expirationTime;
        this.stakeAddress = stakeAddress;
        this.id = id;
    }
    static fromJson(json) {
        return new LiquidityStakeEntry(BigNumber.from(json.amount.toString()), TokenStandard.parse(json.tokenStandard), BigNumber.from(json.weightedAmount.toString()), json.startTime, json.revokeTime, json.expirationTime, Address.parse(json.stakeAddress), Hash.parse(json.id));
    }
}
export class LiquidityStakeList extends Model {
    constructor(totalAmount, totalWeightedAmount, count, list) {
        super();
        this.totalAmount = totalAmount;
        this.totalWeightedAmount = totalWeightedAmount;
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new LiquidityStakeList(BigNumber.from(json.totalAmount.toString()), BigNumber.from(json.totalWeightedAmount.toString()), json.count, json.list.map(LiquidityStakeEntry.fromJson));
    }
}
//# sourceMappingURL=liquidity.js.map