import { Model } from "../base.js";
import { Address } from "../primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { Token } from "./token.js";
export class AccountInfo extends Model {
    constructor(address, blockCount = 0, balanceInfoMap = {}) {
        super();
        this.address = address;
        this.blockCount = blockCount;
        this.balanceInfoMap = balanceInfoMap;
    }
    static fromJson(json) {
        const balanceInfoMap = {};
        if (json.accountHeight > 0 && json.balanceInfoMap) {
            for (const [key, value] of Object.entries(json.balanceInfoMap)) {
                balanceInfoMap[key] = BalanceInfoListItem.fromJson(value);
            }
        }
        return new AccountInfo(Address.parse(json.address), json.accountHeight, balanceInfoMap);
    }
    toJson() {
        const balanceInfoMapJson = {};
        for (const [key, value] of Object.entries(this.balanceInfoMap)) {
            balanceInfoMapJson[key] = value.toJson();
        }
        return {
            address: this.address.toString(),
            blockCount: this.blockCount,
            balanceInfoMap: balanceInfoMapJson,
        };
    }
}
export class BalanceInfoListItem extends Model {
    constructor(token, balance) {
        super();
        this.token = token;
        this.balance = balance;
    }
    static fromJson(json) {
        return new BalanceInfoListItem(Token.fromJson(json.token), BigNumber.from(json.balance));
    }
}
//# sourceMappingURL=accountInfo.js.map