import { BigNumber } from "../../utilities/bignumber.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export class StakeEntry extends Model {
    constructor(amount, weightedAmount, startTimestamp, expirationTimestamp, address, id) {
        super();
        this.amount = amount;
        this.weightedAmount = weightedAmount;
        this.startTimestamp = startTimestamp;
        this.expirationTimestamp = expirationTimestamp;
        this.address = address;
        this.id = id;
    }
    static fromJson(json) {
        return new StakeEntry(BigNumber.from(json.amount.toString()), BigNumber.from(json.weightedAmount.toString()), json.startTimestamp, json.expirationTimestamp, Address.parse(json.address), Hash.parse(json.id));
    }
}
export class StakeList extends Model {
    constructor(totalAmount, totalWeightedAmount, count, list) {
        super();
        this.totalAmount = totalAmount;
        this.totalWeightedAmount = totalWeightedAmount;
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new StakeList(json.totalAmount, json.totalWeightedAmount, json.count, json.list.map(StakeEntry.fromJson));
    }
}
//# sourceMappingURL=stake.js.map